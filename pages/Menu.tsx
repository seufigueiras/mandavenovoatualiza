import React, { useEffect, useState, useRef } from 'react';
import { Card, CardContent } from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Badge from '../components/ui/Badge';
import { supabase } from '../services/supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import { Product } from '../types';
import { syncRAG } from '../services/n8nService';
import toast from 'react-hot-toast';
import { Edit, Trash2, Plus, Bot, EyeOff, Upload, X } from 'lucide-react';

const Menu: React.FC = () => {
  const { restaurantId } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  
  // Form State
  const [formData, setFormData] = useState<Partial<Product>>({
    name: '',
    description: '',
    price: 0,
    category: 'Geral',
    image_url: '',
    is_active: true,
    is_visible: true,
  });

  const [imagePreview, setImagePreview] = useState<string>('');
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    if (restaurantId) fetchProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [restaurantId]);

  const fetchProducts = async () => {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('restaurant_id', restaurantId)
      .order('name');
    
    if (error) {
      toast.error('Erro ao buscar produtos');
    } else {
      setProducts(data || []);
    }
  };

  const handleSync = async () => {
    if (!restaurantId) {
      toast.error('ID do restaurante não encontrado');
      return;
    }
    
    setIsSyncing(true);
    try {
      await syncRAG(restaurantId);
      toast.success('Sincronização com IA iniciada!');
    } catch (e) {
      toast.error('Falha ao sincronizar');
      console.error(e);
    } finally {
      setIsSyncing(false);
    }
  };

  // Upload de imagem para Supabase Storage
  const handleImageUpload = async (file: File): Promise<string | null> => {
    try {
      setIsUploading(true);

      // Validar se é imagem
      if (!file.type.startsWith('image/')) {
        toast.error('Selecione um arquivo de imagem válido');
        return null;
      }

      // Validar tamanho (máximo 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Imagem muito grande (máximo 5MB)');
        return null;
      }

      // Criar nome único para o arquivo
      const timestamp = Date.now();
      const fileName = `${restaurantId}/${timestamp}-${file.name}`;

      // Fazer upload para Supabase Storage
      const { data, error } = await supabase.storage
        .from('produtos')
        .upload(fileName, file);

      if (error) {
        toast.error(`Erro ao fazer upload: ${error.message}`);
        return null;
      }

      // Obter URL pública da imagem
      const { data: publicData } = supabase.storage
        .from('produtos')
        .getPublicUrl(fileName);

      return publicData.publicUrl;
    } catch (e) {
      toast.error('Erro ao fazer upload da imagem');
      console.error(e);
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  // Quando o usuário seleciona uma imagem
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Mostrar preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    // Fazer upload automaticamente
    const imageUrl = await handleImageUpload(file);
    if (imageUrl) {
      setFormData({ ...formData, image_url: imageUrl });
      toast.success('Imagem enviada com sucesso!');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const payload = {
        ...formData,
        restaurant_id: restaurantId,
        price: Number(formData.price),
    };

    let error;

    if (editingId) {
        const { error: updateError } = await supabase
            .from('products')
            .update(payload)
            .eq('id', editingId);
        error = updateError;
    } else {
        const { error: insertError } = await supabase
            .from('products')
            .insert([payload]);
        error = insertError;
    }

    if (error) {
        toast.error('Erro ao salvar produto');
        console.error(error);
    } else {
        toast.success(editingId ? 'Produto atualizado!' : 'Produto criado!');
        setShowForm(false);
        setEditingId(null);
        setImagePreview('');
        setFormData({
            name: '', description: '', price: 0, category: 'Geral', 
            image_url: '', is_active: true, is_visible: true
        });
        fetchProducts();
        
        // AUTO SYNC RAG
        handleSync();
    }
  };

  const handleEdit = (product: Product) => {
      setEditingId(product.id);
      setFormData(product);
      setImagePreview(product.image_url || '');
      setShowForm(true);
  };

  const handleDelete = async (id: string) => {
      if(!confirm("Tem certeza que deseja excluir?")) return;
      
      const { error } = await supabase.from('products').delete().eq('id', id);
      if(error) {
          toast.error("Erro ao excluir");
      } else {
          toast.success("Produto excluído");
          fetchProducts();
          handleSync();
      }
  };

  const removeImage = () => {
    setImagePreview('');
    setFormData({ ...formData, image_url: '' });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Cardápio Digital</h1>
        <div className="flex gap-2">
          <Button 
            variant="secondary" 
            onClick={handleSync} 
            isLoading={isSyncing}
            className="flex items-center gap-2"
          >
            <Bot size={18} /> Sincronizar IA
          </Button>
          <Button onClick={() => { setShowForm(!showForm); setEditingId(null); setImagePreview(''); }} className="flex items-center gap-2">
            <Plus size={18} /> Novo Produto
          </Button>
        </div>
      </div>

      {showForm && (
        <Card className="bg-slate-50 border-slate-200">
            <CardContent className="pt-6">
                <form onSubmit={handleSubmit} className="grid gap-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input 
                            placeholder="Nome do Produto" 
                            value={formData.name} 
                            onChange={e => setFormData({...formData, name: e.target.value})} 
                            required 
                            disabled={isUploading}
                        />
                        <Input 
                            placeholder="Categoria" 
                            value={formData.category} 
                            onChange={e => setFormData({...formData, category: e.target.value})} 
                            required 
                            disabled={isUploading}
                        />
                    </div>
                    <Input 
                        placeholder="Descrição" 
                        value={formData.description} 
                        onChange={e => setFormData({...formData, description: e.target.value})} 
                        disabled={isUploading}
                    />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input 
                            type="number" 
                            step="0.01" 
                            placeholder="Preço" 
                            value={formData.price} 
                            onChange={e => setFormData({...formData, price: parseFloat(e.target.value)})} 
                            required 
                            disabled={isUploading}
                        />
                        <div className="flex items-center gap-2 border rounded-md px-3 bg-white">
                            <input 
                                type="checkbox" 
                                checked={formData.is_visible} 
                                onChange={e => setFormData({...formData, is_visible: e.target.checked})}
                                id="vis_check"
                                disabled={isUploading}
                            />
                            <label htmlFor="vis_check" className="text-sm cursor-pointer">Visível para IA?</label>
                        </div>
                    </div>

                    {/* Seção de Upload de Imagem */}
                    <div className="border-2 border-dashed border-slate-300 rounded-lg p-4 bg-white">
                        <div className="flex flex-col items-center justify-center">
                            {imagePreview ? (
                                <div className="w-full">
                                    <div className="relative w-full">
                                        <img 
                                            src={imagePreview} 
                                            alt="Preview" 
                                            className="w-full h-40 object-cover rounded-lg"
                                        />
                                        <button
                                            type="button"
                                            onClick={removeImage}
                                            disabled={isUploading}
                                            className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600"
                                        >
                                            <X size={16} />
                                        </button>
                                    </div>
                                    <p className="text-sm text-slate-500 mt-2 text-center">
                                        ✅ Imagem selecionada
                                    </p>
                                </div>
                            ) : (
                                <div className="text-center">
                                    <Upload size={32} className="mx-auto mb-2 text-slate-400" />
                                    <p className="text-sm text-slate-600 mb-2">Clique ou arraste uma imagem</p>
                                    <p className="text-xs text-slate-500">(PNG, JPG - Máximo 5MB)</p>
                                </div>
                            )}
                            <input 
                                ref={fileInputRef}
                                type="file" 
                                accept="image/*"
                                onChange={handleFileSelect}
                                disabled={isUploading}
                                className="hidden"
                                id="image-input"
                            />
                            <label 
                                htmlFor="image-input"
                                className="mt-3 px-4 py-2 bg-blue-600 text-white rounded-lg cursor-pointer hover:bg-blue-700 transition disabled:bg-gray-400"
                                style={{ pointerEvents: isUploading ? 'none' : 'auto', opacity: isUploading ? 0.6 : 1 }}
                            >
                                {isUploading ? 'Enviando...' : 'Selecionar Imagem'}
                            </label>
                        </div>
                    </div>

                    <div className="flex justify-end gap-2">
                        <Button type="button" variant="ghost" onClick={() => { setShowForm(false); setImagePreview(''); }} disabled={isUploading}>Cancelar</Button>
                        <Button type="submit" disabled={isUploading || !formData.name || !formData.price}>
                            {isUploading ? 'Enviando...' : 'Salvar & Sincronizar'}
                        </Button>
                    </div>
                </form>
            </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {products.map((product) => (
          <Card key={product.id} className="overflow-hidden hover:shadow-lg transition-shadow">
            <div className="relative h-48 w-full bg-slate-100">
                {product.image_url ? (
                    <img 
                        src={product.image_url} 
                        alt={product.name} 
                        className="h-full w-full object-cover"
                        onError={(e) => (e.currentTarget.style.display = 'none')}
                    />
                ) : (
                    <div className="h-full w-full flex items-center justify-center text-slate-400">
                        <Upload size={32} />
                    </div>
                )}
                {!product.is_visible && (
                    <div className="absolute top-2 right-2 bg-slate-900/80 text-white px-2 py-1 rounded text-xs flex items-center gap-1">
                        <EyeOff size={12} /> Oculto na IA
                    </div>
                )}
            </div>
            <CardContent className="p-4">
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-bold text-lg">{product.name}</h3>
                <span className="font-semibold text-green-600">R$ {product.price.toFixed(2)}</span>
              </div>
              <p className="text-sm text-slate-500 mb-4 h-10 line-clamp-2">{product.description}</p>
              
              <div className="flex justify-between items-center mt-4">
                <Badge>{product.category}</Badge>
                <div className="flex gap-2">
                    <Button size="sm" variant="secondary" onClick={() => handleEdit(product)}>
                        <Edit size={16} />
                    </Button>
                    <Button size="sm" variant="danger" onClick={() => handleDelete(product.id)}>
                        <Trash2 size={16} />
                    </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default Menu;