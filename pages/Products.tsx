import React, { useEffect, useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../services/supabaseClient';
import toast from 'react-hot-toast';
import { Plus, UtensilsCrossed, Trash2, Edit, Save, X, Upload } from 'lucide-react';

type Product = {
    id: string;
    category: string; 
    name: string;
    description: string | null; 
    price: number;
    is_active: boolean; 
    is_visible: boolean; 
    image_url: string | null;
    created_at: string;
    restaurant_id: string; 
};

type GroupedProducts = {
    [categoryName: string]: Product[];
};

const Products: React.FC = () => {
    const { restaurantId } = useAuth();
    const [loading, setLoading] = useState(false);
    const [groupedProducts, setGroupedProducts] = useState<GroupedProducts>({});
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isUploading, setIsUploading] = useState(false);
    
    // Estados do Formulário de Adição
    const [newProductName, setNewProductName] = useState('');
    const [newPrice, setNewPrice] = useState('');
    const [newCategory, setNewCategory] = useState('');
    const [newDescription, setNewDescription] = useState('');
    const [newImageUrl, setNewImageUrl] = useState('');
    const [newImagePreview, setNewImagePreview] = useState('');
    const [isAdding, setIsAdding] = useState(false);

    // ESTADOS PARA EDIÇÃO INLINE
    const [editingProductId, setEditingProductId] = useState<string | null>(null);
    const [editData, setEditData] = useState<Partial<Product>>({});
    const [editImagePreview, setEditImagePreview] = useState('');
    const [isUpdating, setIsUpdating] = useState(false);
    const editFileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (restaurantId) {
            fetchProductsAndGroup();
        }
    }, [restaurantId]);

    // Função de Upload para Supabase Storage
    const handleImageUpload = async (file: File): Promise<string | null> => {
        try {
            if (!file.type.startsWith('image/')) {
                toast.error('Selecione um arquivo de imagem válido');
                return null;
            }

            if (file.size > 5 * 1024 * 1024) {
                toast.error('Imagem muito grande (máximo 5MB)');
                return null;
            }

            const timestamp = Date.now();
            const fileName = `${restaurantId}/${timestamp}-${file.name}`;

            const { data, error } = await supabase.storage
                .from('produtos')
                .upload(fileName, file);

            if (error) {
                toast.error(`Erro ao fazer upload: ${error.message}`);
                return null;
            }

            const { data: publicData } = supabase.storage
                .from('produtos')
                .getPublicUrl(fileName);

            return publicData.publicUrl;
        } catch (e) {
            toast.error('Erro ao fazer upload da imagem');
            console.error(e);
            return null;
        }
    };

    // Quando o usuário seleciona uma imagem (formulário de adição)
    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onloadend = () => {
            setNewImagePreview(reader.result as string);
        };
        reader.readAsDataURL(file);

        setIsUploading(true);
        const imageUrl = await handleImageUpload(file);
        setIsUploading(false);
        
        if (imageUrl) {
            setNewImageUrl(imageUrl);
            toast.success('Imagem enviada com sucesso!');
        }
    };

    // Quando o usuário seleciona uma imagem (formulário de edição)
    const handleEditFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onloadend = () => {
            setEditImagePreview(reader.result as string);
        };
        reader.readAsDataURL(file);

        setIsUploading(true);
        const imageUrl = await handleImageUpload(file);
        setIsUploading(false);
        
        if (imageUrl) {
            setEditData({ ...editData, image_url: imageUrl });
            toast.success('Imagem enviada com sucesso!');
        }
    };

    const fetchProductsAndGroup = async () => {
        setLoading(true);
        
        const { data, error } = await supabase
            .from('products')
            .select('*')
            .eq('restaurant_id', restaurantId) 
            .order('category', { ascending: true }) 
            .order('name', { ascending: true }); 

        if (error) {
            toast.error("Erro ao carregar produtos. Verifique o RLS e a coluna 'restaurant_id' no Supabase.");
            console.error("Fetch Products Error:", error);
            setGroupedProducts({}); 
        } else if (data) {
            const groups: GroupedProducts = data.reduce((acc, product) => {
                const category = product.category || 'Sem Categoria'; 
                if (!acc[category]) {
                    acc[category] = [];
                }
                acc[category].push(product);
                return acc;
            }, {} as GroupedProducts);

            setGroupedProducts(groups);
        }
        setLoading(false);
    };

    const handleAddProduct = async () => {
        if (!newProductName.trim() || !newPrice.trim() || !newCategory.trim()) {
            toast.error('Preencha nome, preço e categoria.');
            return;
        }

        setIsAdding(true);

        const newProduct = {
            restaurant_id: restaurantId,
            name: newProductName.trim(),
            price: parseFloat(newPrice.replace(',', '.')), 
            category: newCategory.trim(),
            description: newDescription.trim() || null, // Incluindo descrição
            image_url: newImageUrl.trim() || null,
            is_active: true, 
            is_visible: true, 
        };
        
        const { error } = await supabase
            .from('products')
            .insert([newProduct]);

        if (error) {
            toast.error(`Erro ao criar produto: ${error.message}.`);
            console.error(error);
        } else {
            toast.success('Produto criado com sucesso!');
            setNewProductName('');
            setNewPrice('');
            setNewCategory('');
            setNewDescription('');  // Resetando descrição
            setNewImageUrl('');
            setNewImagePreview('');
            fetchProductsAndGroup(); 
        }

        setIsAdding(false);
    };

    const handleDeleteProduct = async (productId: string, productName: string) => {
        if (!confirm(`Tem certeza que deseja excluir o produto "${productName}"? Esta ação não pode ser desfeita.`)) {
            return;
        }

        setLoading(true);

        const { error } = await supabase
            .from('products')
            .delete()
            .eq('id', productId)
            .eq('restaurant_id', restaurantId); 

        if (error) {
            toast.error(`Erro ao excluir produto: ${error.message}.`);
            console.error(error);
        } else {
            toast.success('Produto excluído com sucesso!');
            fetchProductsAndGroup();
        }

        setLoading(false);
    };

    const startEditing = (product: Product) => {
        setEditingProductId(product.id);
        setEditData({
            name: product.name,
            price: product.price.toString(), 
            category: product.category,
            description: product.description || '',
            image_url: product.image_url || '',
            is_active: product.is_active,
            is_visible: product.is_visible,
        });
        setEditImagePreview(product.image_url || '');
    };

    const cancelEditing = () => {
        setEditingProductId(null);
        setEditData({});
        setEditImagePreview('');
    };

    const handleUpdateProduct = async () => {
        if (!editingProductId || !editData.name || !editData.price || !editData.category) {
            toast.error('Preencha todos os campos obrigatórios.');
            return;
        }

        setIsUpdating(true);

        const updatedData = {
            name: editData.name,
            price: parseFloat(editData.price.toString().replace(',', '.')), 
            category: editData.category, 
            image_url: editData.image_url || null,
            description: editData.description || null,  // Incluindo descrição
            is_active: editData.is_active,
            is_visible: editData.is_visible,
        };
        
        const { error } = await supabase
            .from('products')
            .update(updatedData)
            .eq('id', editingProductId)
            .eq('restaurant_id', restaurantId); 

        if (error) {
            toast.error(`Erro ao atualizar produto: ${error.message}.`);
            console.error(error);
        } else {
            toast.success('Produto atualizado com sucesso!');
            cancelEditing();
            fetchProductsAndGroup();
        }

        setIsUpdating(false);
    };

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">
                <UtensilsCrossed size={28} className="inline mr-2 text-indigo-600" />
                Gestão do Cardápio Online
            </h1>

            {/* Formulário de Adição de Produto */}
            <Card className="p-4 border">
                <CardTitle className="mb-4 text-lg">Adicionar Novo Produto</CardTitle>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                    <Input 
                        placeholder="Nome do Produto"
                        value={newProductName}
                        onChange={e => setNewProductName(e.target.value)}
                        disabled={isAdding || isUploading}
                    />
                    <Input 
                        placeholder="Preço (ex: 45.90)"
                        type="number"
                        value={newPrice}
                        onChange={e => setNewPrice(e.target.value)}
                        disabled={isAdding || isUploading}
                    />
                    <Input 
                        placeholder="Categoria (ex: Pizzas Doces)"
                        value={newCategory}
                        onChange={e => setNewCategory(e.target.value)}
                        disabled={isAdding || isUploading}
                    />
                    <textarea
                        placeholder="Descrição do produto (o que vem no item)"
                        value={newDescription}
                        onChange={e => setNewDescription(e.target.value)}
                        disabled={isAdding || isUploading}
                        className="md:col-span-4 p-3 border rounded-md text-sm"
                        rows={3}
                    />
                </div>

                {/* Preview da nova imagem */}
                {newImagePreview && (
                    <div className="mb-4 relative w-24 h-24">
                        <img src={newImagePreview} alt="Preview" className="w-full h-full object-cover rounded-lg" />
                        <button
                            type="button"
                            onClick={() => setNewImagePreview('')}
                            disabled={isAdding || isUploading}
                            className="absolute top-0 right-0 bg-red-500 text-white p-1 rounded-full hover:bg-red-600"
                        >
                            <X size={14} />
                        </button>
                    </div>
                )}

                <div className="flex gap-2">
                    <input 
                        ref={fileInputRef}
                        type="file" 
                        accept="image/*"
                        onChange={handleFileSelect}
                        disabled={isAdding || isUploading}
                        className="hidden"
                        id="new-image-input"
                    />
                    <label 
                        htmlFor="new-image-input"
                        className="flex items-center justify-center px-3 py-2 bg-blue-600 text-white rounded-md cursor-pointer hover:bg-blue-700 transition disabled:bg-gray-400"
                        style={{ pointerEvents: isAdding || isUploading ? 'none' : 'auto', opacity: isAdding || isUploading ? 0.6 : 1 }}
                    >
                        <Upload size={16} className="mr-1" />
                        Foto
                    </label>
                </div>

                <Button 
                    onClick={handleAddProduct}
                    isLoading={isAdding}
                    disabled={isUploading}
                    className="w-full bg-indigo-600 hover:bg-indigo-700"
                >
                    <Plus size={16} /> Salvar Produto
                </Button>
            </Card>

            {/* Lista de Produtos Agrupados */}
            <div className="space-y-8">
                {/* Exibição dos produtos */}
            </div>
        </div>
    );
};

export default Products;
