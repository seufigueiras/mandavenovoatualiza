import React, { useEffect, useState, useRef } from 'react';
import { Card, CardHeader, CardTitle } from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../services/supabaseClient';
import toast from 'react-hot-toast';
import { Plus, UtensilsCrossed, X } from 'lucide-react';

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
  const [isAdding, setIsAdding] = useState(false);

  // FORMULÁRIO
  const [newProductName, setNewProductName] = useState('');
  const [newPrice, setNewPrice] = useState('');
  const [newCategory, setNewCategory] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newImageUrl, setNewImageUrl] = useState('');
  const [newImagePreview, setNewImagePreview] = useState('');

  useEffect(() => {
    if (restaurantId) {
      fetchProductsAndGroup();
    }
  }, [restaurantId]);

  const handleImageUpload = async (file: File): Promise<string | null> => {
    if (!file.type.startsWith('image/')) {
      toast.error('Selecione uma imagem válida');
      return null;
    }

    const fileName = `${restaurantId}/${Date.now()}-${file.name}`;

    const { error } = await supabase.storage
      .from('produtos')
      .upload(fileName, file);

    if (error) {
      toast.error('Erro ao enviar imagem');
      return null;
    }

    const { data } = supabase.storage
      .from('produtos')
      .getPublicUrl(fileName);

    return data.publicUrl;
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => setNewImagePreview(reader.result as string);
    reader.readAsDataURL(file);

    setIsUploading(true);
    const url = await handleImageUpload(file);
    setIsUploading(false);

    if (url) {
      setNewImageUrl(url);
      toast.success('Imagem enviada!');
    }
  };

  const fetchProductsAndGroup = async () => {
    setLoading(true);

    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('restaurant_id', restaurantId)
      .order('category')
      .order('name');

    if (error) {
      toast.error('Erro ao carregar produtos');
      setGroupedProducts({});
    } else if (data) {
      const grouped = data.reduce((acc: GroupedProducts, product: Product) => {
        const cat = product.category || 'Sem categoria';
        acc[cat] = acc[cat] || [];
        acc[cat].push(product);
        return acc;
      }, {});
      setGroupedProducts(grouped);
    }

    setLoading(false);
  };

  const handleAddProduct = async () => {
    if (!newProductName || !newPrice || !newCategory) {
      toast.error('Preencha nome, preço e categoria');
      return;
    }

    setIsAdding(true);

    const newProduct = {
      restaurant_id: restaurantId,
      name: newProductName.trim(),
      price: parseFloat(newPrice.replace(',', '.')),
      category: newCategory.trim(),
      description: newDescription.trim() || null,
      image_url: newImageUrl || null,
      is_active: true,
      is_visible: true,
    };

    const { error } = await supabase.from('products').insert([newProduct]);

    if (error) {
      toast.error('Erro ao criar produto');
    } else {
      toast.success('Produto criado com sucesso!');
      setNewProductName('');
      setNewPrice('');
      setNewCategory('');
      setNewDescription('');
      setNewImageUrl('');
      setNewImagePreview('');
      fetchProductsAndGroup();
    }

    setIsAdding(false);
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">
        <UtensilsCrossed className="inline mr-2 text-indigo-600" />
        Gestão do Cardápio
      </h1>

      <Card className="p-4">
        <CardTitle className="mb-4">Adicionar Novo Produto</CardTitle>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Input
            placeholder="Nome do produto"
            value={newProductName}
            onChange={e => setNewProductName(e.target.value)}
            disabled={isAdding}
          />

          <Input
            placeholder="Preço"
            type="number"
            value={newPrice}
            onChange={e => setNewPrice(e.target.value)}
            disabled={isAdding}
          />

          <Input
            placeholder="Categoria"
            value={newCategory}
            onChange={e => setNewCategory(e.target.value)}
            disabled={isAdding}
          />

          <textarea
            placeholder="Descrição do produto (o que vem no item)"
            value={newDescription}
            onChange={e => setNewDescription(e.target.value)}
            className="md:col-span-4 p-3 border rounded-md text-sm"
            rows={3}
          />
        </div>

        {newImagePreview && (
          <div className="mt-4 relative w-24 h-24">
            <img src={newImagePreview} className="w-full h-full rounded object-cover" />
            <button
              onClick={() => setNewImagePreview('')}
              className="absolute top-0 right-0 bg-red-500 text-white p-1 rounded-full"
            >
              <X size={14} />
            </button>
          </div>
        )}

        <input
          type="file"
          hidden
          ref={fileInputRef}
          onChange={handleFileSelect}
        />

        <Button
          onClick={handleAddProduct}
          isLoading={isAdding}
          className="w-full mt-4 bg-indigo-600"
        >
          <Plus size={16} /> Salvar Produto
        </Button>
      </Card>
    </div>
  );
};

export default Products;
