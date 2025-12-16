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
  restaurant_id: string;
  name: string;
  description: string | null;
  price: number;
  category: string;
  image_url: string | null;
  is_active: boolean;
  is_visible: boolean;
  created_at: string;
  display_order: number | null;
};

type GroupedProducts = {
  [category: string]: Product[];
};

const Products: React.FC = () => {
  const { restaurantId } = useAuth();

  const [loading, setLoading] = useState(false);
  const [groupedProducts, setGroupedProducts] = useState<GroupedProducts>({});
  const [isUploading, setIsUploading] = useState(false);

  // ADD
  const [newName, setNewName] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newPrice, setNewPrice] = useState('');
  const [newCategory, setNewCategory] = useState('');
  const [newImageUrl, setNewImageUrl] = useState('');
  const [newImagePreview, setNewImagePreview] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // EDIT
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<Partial<Product>>({});
  const [editImagePreview, setEditImagePreview] = useState('');
  const editFileInputRef = useRef<HTMLInputElement>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    if (restaurantId) fetchProducts();
  }, [restaurantId]);

  // ================= FETCH =================
  const fetchProducts = async () => {
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
        acc[p.category] = acc[p.category] || [];
        acc[p.category].push(p);
        return acc;
      }, {});
      setGroupedProducts(grouped);
    }
    setLoading(false);
  };

  // ================= UPLOAD =================
  const uploadImage = async (file: File) => {
    if (!restaurantId) return null;
    const fileName = `${restaurantId}/${Date.now()}-${file.name}`;

    const { error } = await supabase.storage
      .from('produtos')
      .upload(fileName, file);

    if (error) {
      toast.error('Erro no upload');
      return null;
    }

    return supabase.storage.from('produtos').getPublicUrl(fileName).data.publicUrl;
  };

  const handleFile = async (
    e: React.ChangeEvent<HTMLInputElement>,
    setUrl: (v: string) => void,
    setPreview: (v: string) => void
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setPreview(URL.createObjectURL(file));
    setIsUploading(true);
    const url = await uploadImage(file);
    setIsUploading(false);

    if (url) setUrl(url);
  };

  // ================= ADD =================
  const addProduct = async () => {
    if (!newName || !newPrice || !newCategory) {
      toast.error('Preencha nome, preço e categoria');
      return;
    }

    setIsAdding(true);
    const { error } = await supabase.from('products').insert({
      restaurant_id: restaurantId,
      name: newName,
      description: newDescription || null,
      price: Number(newPrice),
      category: newCategory,
      image_url: newImageUrl || null,
      is_active: true,
      is_visible: true,
    });

    if (!error) {
      toast.success('Produto criado');
      setNewName('');
      setNewDescription('');
      setNewPrice('');
      setNewCategory('');
      setNewImageUrl('');
      setNewImagePreview('');
      fetchProducts();
    } else {
      toast.error(error.message);
    }
    setIsAdding(false);
  };

  // ================= DELETE =================
  const deleteProduct = async (id: string) => {
    if (!confirm('Deseja excluir este produto?')) return;
    await supabase.from('products').delete().eq('id', id);
    fetchProducts();
  };

  // ================= EDIT =================
  const startEdit = (p: Product) => {
    setEditingId(p.id);
    setEditData({ ...p });
    setEditImagePreview(p.image_url || '');
  };

  const saveEdit = async () => {
    if (!editingId) return;

    const { error } = await supabase
      .from('products')
      .update({
        name: editData.name,
        description: editData.description || null,
        price: Number(editData.price),
        category: editData.category,
        image_url: editData.image_url || null,
        is_active: editData.is_active,
        is_visible: editData.is_visible,
      })
      .eq('id', editingId);

    if (!error) {
      toast.success('Produto atualizado');
      setEditingId(null);
      fetchProducts();
    } else {
      toast.error(error.message);
    }
  };

  // ================= UI =================
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">
        <UtensilsCrossed className="inline mr-2" /> Cardápio
      </h1>

      <Card className="p-4">
        <CardTitle>Adicionar Produto</CardTitle>
        <div className="grid md:grid-cols-5 gap-3 mt-3">
          <Input placeholder="Nome" value={newName} onChange={e => setNewName(e.target.value)} />
          <Input placeholder="Descrição" value={newDescription} onChange={e => setNewDescription(e.target.value)} />
          <Input placeholder="Preço" type="number" value={newPrice} onChange={e => setNewPrice(e.target.value)} />
          <Input placeholder="Categoria" value={newCategory} onChange={e => setNewCategory(e.target.value)} />
          <input type="file" hidden ref={fileInputRef} onChange={e => handleFile(e, setNewImageUrl, setNewImagePreview)} />
          <Button onClick={() => fileInputRef.current?.click()}><Upload size={16} /></Button>
        </div>

        {newImagePreview && <img src={newImagePreview} className="w-24 mt-3 rounded" />}

        <Button className="mt-4" onClick={addProduct} isLoading={isAdding}>
          <Plus size={16} /> Salvar
        </Button>
      </Card>

      {Object.keys(groupedProducts).map(cat => (
        <Card key={cat}>
          <CardHeader><CardTitle>{cat}</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {groupedProducts[cat].map(p => (
              <div key={p.id} className="border p-3 rounded flex justify-between">
                {editingId === p.id ? (
                  <div className="w-full space-y-2">
                    <Input value={editData.name || ''} onChange={e => setEditData({ ...editData, name: e.target.value })} />
                    <Input value={editData.description || ''} onChange={e => setEditData({ ...editData, description: e.target.value })} />
                    <Input type="number" value={editData.price || ''} onChange={e => setEditData({ ...editData, price: e.target.value })} />
                    <label><input type="checkbox" checked={editData.is_visible} onChange={e => setEditData({ ...editData, is_visible: e.target.checked })} /> Visível</label>
                    <Button onClick={saveEdit}><Save size={16} /></Button>
                    <Button variant="ghost" onClick={() => setEditingId(null)}><X /></Button>
                  </div>
                ) : (
                  <>
                    <div>
                      <strong>{p.name}</strong>
                      <p className="text-sm">{p.description}</p>
                      <p className="text-xs">{p.category}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="ghost" onClick={() => startEdit(p)}><Edit size={16} /></Button>
                      <Button variant="ghost" onClick={() => deleteProduct(p.id)}><Trash2 size={16} /></Button>
                    </div>
                  </>
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
