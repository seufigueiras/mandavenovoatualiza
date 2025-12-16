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

  // UPLOAD
  const handleImageUpload = async (file: File): Promise<string | null> => {
    const fileName = `${restaurantId}/${Date.now()}-${file.name}`;
    const { error } = await supabase.storage.from('produtos').upload(fileName, file);
    if (error) return null;
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

  const handleEditFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setEditImagePreview(URL.createObjectURL(file));
    const url = await handleImageUpload(file);
    if (url) setEditData({ ...editData, image_url: url });
    setIsUploading(false);
  };

  // FETCH
  const fetchProductsAndGroup = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('products')
      .select('*')
      .eq('restaurant_id', restaurantId)
      .order('category')
      .order('name');

    if (data) {
      const groups = data.reduce((acc: GroupedProducts, p) => {
        const cat = p.category || 'Sem Categoria';
        if (!acc[cat]) acc[cat] = [];
        acc[cat].push(p);
        return acc;
      }, {});
      setGroupedProducts(groups);
    }
    setLoading(false);
  };

  // ADD
  const handleAddProduct = async () => {
    setIsAdding(true);

    await supabase.from('products').insert([{
      restaurant_id: restaurantId,
      name: newProductName,
      description: newDescription || null,
      price: parseFloat(newPrice),
      category: newCategory,
      image_url: newImageUrl || null,
      is_active: true,
      is_visible: true,
    }]);

    setNewProductName('');
    setNewDescription('');
    setNewPrice('');
    setNewCategory('');
    setNewImageUrl('');
    setNewImagePreview('');
    fetchProductsAndGroup();
    setIsAdding(false);
  };

  // DELETE
  const handleDeleteProduct = async (id: string, name: string) => {
    if (!confirm(`Excluir "${name}"?`)) return;
    await supabase.from('products').delete().eq('id', id);
    fetchProductsAndGroup();
  };

  // EDIT
  const startEditing = (p: Product) => {
    setEditingProductId(p.id);
    setEditData(p);
    setEditImagePreview(p.image_url || '');
  };

  const cancelEditing = () => {
    setEditingProductId(null);
    setEditData({});
    setEditImagePreview('');
  };

  const handleUpdateProduct = async () => {
    await supabase
      .from('products')
      .update(editData)
      .eq('id', editingProductId);

    cancelEditing();
    fetchProductsAndGroup();
  };

  const categories = Object.keys(groupedProducts);

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">
        <UtensilsCrossed className="inline mr-2" /> Gestão do Cardápio
      </h1>

      {/* ADD */}
      <Card className="p-4">
        <CardTitle>Adicionar Produto</CardTitle>

        <div className="grid md:grid-cols-4 gap-3 mt-3">
          <Input placeholder="Nome" value={newProductName} onChange={e => setNewProductName(e.target.value)} />
          <Input placeholder="Preço" type="number" value={newPrice} onChange={e => setNewPrice(e.target.value)} />
          <Input placeholder="Categoria" value={newCategory} onChange={e => setNewCategory(e.target.value)} />
          <label className="bg-blue-600 text-white rounded-md flex items-center justify-center cursor-pointer">
            <Upload size={16} />
            <input type="file" hidden ref={fileInputRef} onChange={handleFileSelect} />
          </label>
        </div>

        {/* DESCRIÇÃO */}
        <Input
          className="mt-3"
          placeholder="Descrição do produto (o que vem no item)"
          value={newDescription}
          onChange={e => setNewDescription(e.target.value)}
        />

        <Button className="mt-4 w-full" onClick={handleAddProduct}>
          <Plus size={16} /> Salvar Produto
        </Button>
      </Card>

      {/* LIST */}
      {categories.map(cat => (
        <Card key={cat}>
          <CardHeader><CardTitle>{cat}</CardTitle></CardHeader>
          <CardContent>
            {groupedProducts[cat].map(p => (
              <div key={p.id} className="p-3 border rounded mb-2">
                {editingProductId === p.id ? (
                  <>
                    <Input value={editData.name || ''} onChange={e => setEditData({ ...editData, name: e.target.value })} />
                    <Input value={editData.description || ''} onChange={e => setEditData({ ...editData, description: e.target.value })} />
                    <div className="flex gap-2 mt-2">
                      <Button size="sm" onClick={handleUpdateProduct}><Save size={14} /></Button>
                      <Button size="sm" variant="ghost" onClick={cancelEditing}><X size={14} /></Button>
                    </div>
                  </>
                ) : (
                  <div className="flex justify-between">
                    <div>
                      <strong>{p.name}</strong>
                      {p.description && <p className="text-sm text-gray-500">{p.description}</p>}
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="ghost" onClick={() => startEditing(p)}><Edit size={16} /></Button>
                      <Button size="sm" variant="ghost" onClick={() => handleDeleteProduct(p.id, p.name)}>
                        <Trash2 size={16} className="text-red-500" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default Products;
