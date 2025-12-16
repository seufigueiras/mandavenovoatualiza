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
  const editFileInputRef = useRef<HTMLInputElement>(null);

  const [isUploading, setIsUploading] = useState(false);

  // ADD
  const [newProductName, setNewProductName] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newPrice, setNewPrice] = useState('');
  const [newCategory, setNewCategory] = useState('');
  const [newImageUrl, setNewImageUrl] = useState('');
  const [newImagePreview, setNewImagePreview] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  // EDIT
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [editData, setEditData] = useState<Partial<Product>>({});
  const [editImagePreview, setEditImagePreview] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    if (restaurantId) fetchProductsAndGroup();
  }, [restaurantId]);

  const handleImageUpload = async (file: File): Promise<string | null> => {
    if (!file.type.startsWith('image/')) {
      toast.error('Arquivo inválido');
      return null;
    }

    const fileName = `${restaurantId}/${Date.now()}-${file.name}`;
    const { error } = await supabase.storage.from('produtos').upload(fileName, file);

    if (error) {
      toast.error(error.message);
      return null;
    }

    return supabase.storage.from('produtos').getPublicUrl(fileName).data.publicUrl;
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setNewImagePreview(URL.createObjectURL(file));

    const url = await handleImageUpload(file);
    if (url) setNewImageUrl(url);

    setIsUploading(false);
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
    } else {
      const grouped = data.reduce((acc: GroupedProducts, p: Product) => {
        const cat = p.category || 'Sem Categoria';
        if (!acc[cat]) acc[cat] = [];
        acc[cat].push(p);
        return acc;
      }, {});
      setGroupedProducts(grouped);
    }

    setLoading(false);
  };

  const handleAddProduct = async () => {
    if (!newProductName || !newPrice || !newCategory) {
      toast.error('Preencha os campos obrigatórios');
      return;
    }

    setIsAdding(true);

    const { error } = await supabase.from('products').insert([{
      restaurant_id: restaurantId,
      name: newProductName,
      description: newDescription || null,
      price: parseFloat(newPrice),
      category: newCategory,
      image_url: newImageUrl || null,
      is_active: true,
      is_visible: true,
    }]);

    if (!error) {
      toast.success('Produto criado');
      setNewProductName('');
      setNewDescription('');
      setNewPrice('');
      setNewCategory('');
      setNewImageUrl('');
      setNewImagePreview('');
      fetchProductsAndGroup();
    } else {
      toast.error(error.message);
    }

    setIsAdding(false);
  };

  const categories = Object.keys(groupedProducts);

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">
        <UtensilsCrossed className="inline mr-2 text-indigo-600" />
        Gestão do Cardápio
      </h1>

      <Card className="p-4">
        <CardTitle className="mb-4">Adicionar Produto</CardTitle>

        <div className="grid md:grid-cols-4 gap-3">
          <Input placeholder="Nome" value={newProductName} onChange={e => setNewProductName(e.target.value)} />
          <Input placeholder="Preço" type="number" value={newPrice} onChange={e => setNewPrice(e.target.value)} />
          <Input placeholder="Categoria" value={newCategory} onChange={e => setNewCategory(e.target.value)} />

          <label className="bg-blue-600 text-white rounded-md flex items-center justify-center cursor-pointer">
            <Upload size={16} />
            <input type="file" hidden ref={fileInputRef} onChange={handleFileSelect} />
          </label>
        </div>

        <Input
          className="mt-3"
          placeholder="Descrição do produto (o que vem no item)"
          value={newDescription}
          onChange={e => setNewDescription(e.target.value)}
        />

        {newImagePreview && (
          <img src={newImagePreview} className="w-24 h-24 mt-3 rounded object-cover" />
        )}

        <Button className="mt-4 w-full" onClick={handleAddProduct} isLoading={isAdding}>
          <Plus size={16} /> Salvar Produto
        </Button>
      </Card>

      {categories.map(cat => (
        <Card key={cat}>
          <CardHeader><CardTitle>{cat}</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {groupedProducts[cat].map(p => (
              <div key={p.id} className="p-3 border rounded flex justify-between">
                <div className="flex gap-3">
                  {p.image_url && <img src={p.image_url} className="w-12 h-12 rounded object-cover" />}
                  <div>
                    <strong>{p.name}</strong>
                    {p.description && (
                      <p className="text-sm text-gray-600">{p.description}</p>
                    )}
                    <p className="text-xs text-gray-400">{p.category}</p>
                  </div>
                </div>
                <span className="font-bold text-green-600">R$ {p.price.toFixed(2)}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default Products;
