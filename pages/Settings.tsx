import React, { useEffect, useState, useCallback, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { triggerOnboarding } from '../services/n8nService'; 
import { supabase } from '../services/supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
import { QrCode, Smartphone, Save, Upload, X } from 'lucide-react'; 

type OpeningHour = {
    day: string;
    is_open: boolean;
    open_time: string;
    close_time: string;
};

const initialOpeningHours: OpeningHour[] = [
    { day: 'Segunda', is_open: true, open_time: '18:00', close_time: '23:00' },
    { day: 'Terça', is_open: true, open_time: '18:00', close_time: '23:00' },
    { day: 'Quarta', is_open: true, open_time: '18:00', close_time: '23:00' },
    { day: 'Quinta', is_open: true, open_time: '18:00', close_time: '23:00' },
    { day: 'Sexta', is_open: true, open_time: '18:00', close_time: '23:00' },
    { day: 'Sábado', is_open: true, open_time: '12:00', close_time: '00:00' },
    { day: 'Domingo', is_open: false, open_time: '18:00', close_time: '23:00' },
];

const Settings: React.FC = () => {
    const { restaurantId } = useAuth();
    const [loading, setLoading] = useState(false);
    const [isSavingHours, setIsSavingHours] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    
    const INSTANCE_REDIRECT_URL = "https://cantinhodabere-n8n.3xdxtv.easypanel.host/webhook/qrcode";
    
    const [restData, setRestData] = useState({
        name: '',
        address: '',
        delivery_fee: 0,
        phone: '', 
        webhook_url: '',
        image_url: '',
        opening_hours: initialOpeningHours as OpeningHour[]
    });

    const [imagePreview, setImagePreview] = useState<string>('');
    
    useEffect(() => {
        if(restaurantId) {
            fetchRestData();
        }
        return () => {}; 
    }, [restaurantId]); 

    const fetchRestData = async () => {
        const { data } = await supabase.from('restaurants').select('*, opening_hours, webhook_url, phone, image_url').eq('id', restaurantId).single();
        if(data) {
            const savedHours: OpeningHour[] = data.opening_hours || [];
            
            const mergedHours = initialOpeningHours.map(initial => {
                const saved = savedHours.find(s => s.day === initial.day);
                return saved || initial;
            });
            
            setRestData({
                name: data.name,
                address: data.address,
                delivery_fee: data.delivery_fee,
                phone: data.phone || '',
                webhook_url: data.webhook_url || '',
                image_url: data.image_url || '',
                opening_hours: mergedHours
            });

            if (data.image_url) {
                setImagePreview(data.image_url);
            }
        }
    };

    // Upload de imagem para Supabase Storage
    const handleImageUpload = async (file: File): Promise<string | null> => {
        try {
            setIsUploading(true);

            if (!file.type.startsWith('image/')) {
                toast.error('Selecione um arquivo de imagem válido');
                return null;
            }

            if (file.size > 5 * 1024 * 1024) {
                toast.error('Imagem muito grande (máximo 5MB)');
                return null;
            }

            const timestamp = Date.now();
            const fileName = `${restaurantId}/restaurant-${timestamp}-${file.name}`;

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
        } finally {
            setIsUploading(false);
        }
    };

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onloadend = () => {
            setImagePreview(reader.result as string);
        };
        reader.readAsDataURL(file);

        const imageUrl = await handleImageUpload(file);
        if (imageUrl) {
            setRestData({ ...restData, image_url: imageUrl });
            toast.success('Imagem enviada com sucesso!');
        }
    };

    const removeImage = () => {
        setImagePreview('');
        setRestData({ ...restData, image_url: '' });
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleSaveData = async () => {
        const payload = {
            name: restData.name,
            address: restData.address,
            delivery_fee: restData.delivery_fee,
            phone: restData.phone,
            webhook_url: restData.webhook_url,
            image_url: restData.image_url,
        };
        
        const { error } = await supabase.from('restaurants').update(payload).eq('id', restaurantId);
        if(error) toast.error("Erro ao salvar dados básicos");
        else toast.success("Dados básicos atualizados com sucesso!");
    };

    const handleSaveHours = async () => {
        setIsSavingHours(true);
        const toastId = toast.loading('Salvando horários...');

        const { error } = await supabase
            .from('restaurants')
            .update({ opening_hours: restData.opening_hours })
            .eq('id', restaurantId);

        toast.dismiss(toastId);
        if (error) {
            toast.error('Erro ao salvar horários.');
            console.error("Save Hours Error:", error);
        } else {
            toast.success('Horários de funcionamento salvos!');
        }
        setIsSavingHours(false);
    };

    const handleHourChange = (index: number, field: keyof OpeningHour, value: string | boolean) => {
        setRestData(prev => ({
            ...prev,
            opening_hours: prev.opening_hours.map((item, i) => 
                i === index ? { ...item, [field]: value } : item
            )
        }));
    };

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">Configurações</h1>
            
            <div className="grid gap-6 md:grid-cols-2">
                {/* WhatsApp Connection */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Smartphone size={20} /> Conexão WhatsApp & IA
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <p className="text-sm text-slate-600 mb-4">
                            Clique abaixo para gerenciar a instância do WhatsApp. Você será redirecionado para o painel de gerenciamento do QR Code.
                        </p>
                        
                        <a 
                            href={INSTANCE_REDIRECT_URL} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors h-10 px-4 py-2 w-full bg-green-600 text-white hover:bg-green-700 disabled:opacity-50 disabled:pointer-events-none gap-2"
                        >
                            <Smartphone size={16} /> Instância WhatsApp
                        </a>
                        
                    </CardContent>
                </Card>

                {/* Restaurant Data */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <QrCode size={20} /> Dados do Restaurante
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <label className="text-sm font-medium">Nome do Estabelecimento</label>
                            <Input value={restData.name} onChange={e => setRestData({...restData, name: e.target.value})} />
                        </div>
                        <div>
                            <label className="text-sm font-medium">Endereço Completo</label>
                            <Input value={restData.address} onChange={e => setRestData({...restData, address: e.target.value})} />
                        </div>
                        
                        <div>
                            <label className="text-sm font-medium">Telefone do Estabelecimento (WhatsApp)</label>
                            <Input 
                                type="tel" 
                                value={restData.phone} 
                                onChange={e => setRestData({...restData, phone: e.target.value})} 
                                placeholder="(XX) XXXXX-XXXX"
                            />
                        </div>
                        
                        <div>
                            <label className="text-sm font-medium">Taxa de Entrega Padrão (R$)</label>
                            <Input type="number" value={restData.delivery_fee} onChange={e => setRestData({...restData, delivery_fee: parseFloat(e.target.value) || 0})} />
                        </div>
                        
                        <div>
                            <label className="text-sm font-medium">URL Webhook de Pedidos (n8n)</label>
                            <Input 
                                value={restData.webhook_url} 
                                onChange={e => setRestData({...restData, webhook_url: e.target.value})} 
                                placeholder="Cole a URL do Webhook do seu n8n aqui..."
                                type="url"
                            />
                            <p className="text-xs text-slate-500 mt-1">Esta URL será usada para notificar o n8n sobre Novos Pedidos.</p>
                        </div>
                        
                        <Button onClick={handleSaveData} className="w-full flex items-center justify-center gap-2">
                            <Save size={16} /> Salvar Dados Básicos
                        </Button>
                    </CardContent>
                </Card>

                {/* Foto do Restaurante */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            📸 Foto do Restaurante
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <p className="text-sm text-slate-600">Esta foto aparecerá no cardápio digital do cliente.</p>
                        
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
                                            ✅ Foto selecionada
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
                                    id="restaurant-image-input"
                                />
                                <label 
                                    htmlFor="restaurant-image-input"
                                    className="mt-3 px-4 py-2 bg-blue-600 text-white rounded-lg cursor-pointer hover:bg-blue-700 transition disabled:bg-gray-400"
                                    style={{ pointerEvents: isUploading ? 'none' : 'auto', opacity: isUploading ? 0.6 : 1 }}
                                >
                                    {isUploading ? 'Enviando...' : 'Selecionar Imagem'}
                                </label>
                            </div>
                        </div>

                        <Button onClick={handleSaveData} disabled={isUploading} className="w-full flex items-center justify-center gap-2">
                            <Save size={16} /> Salvar Foto
                        </Button>
                    </CardContent>
                </Card>

                {/* Horário de Funcionamento */}
                <Card className="md:col-span-2">
                    <CardHeader>
                        <CardTitle>Horário de Funcionamento</CardTitle>
                        <p className="text-sm text-slate-500">Defina os horários em que sua loja estará aberta para receber pedidos.</p>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        
                        {restData.opening_hours.map((item, index) => (
                            <div key={item.day} className="flex items-center space-x-4 p-3 border rounded-lg bg-slate-50">
                                <span className="w-20 font-medium text-slate-700">{item.day}</span>

                                <label className="flex items-center cursor-pointer">
                                    <input 
                                        type="checkbox" 
                                        checked={item.is_open}
                                        onChange={(e) => handleHourChange(index, 'is_open', e.target.checked)}
                                        className="sr-only" 
                                    />
                                    <div className={`relative w-11 h-6 transition-colors rounded-full shadow ${item.is_open ? 'bg-green-500' : 'bg-red-300'}`}>
                                        <div className={`absolute left-0.5 top-0.5 w-5 h-5 bg-white rounded-full transition-transform transform ${item.is_open ? 'translate-x-5' : 'translate-x-0'}`}></div>
                                    </div>
                                    <span className={`ml-3 text-sm font-medium ${item.is_open ? 'text-green-600' : 'text-red-600'}`}>
                                        {item.is_open ? 'Aberto' : 'Fechado'}
                                    </span>
                                </label>

                                <Input
                                    type="time"
                                    value={item.open_time}
                                    onChange={(e) => handleHourChange(index, 'open_time', e.target.value)}
                                    disabled={!item.is_open}
                                    className="w-28 text-center"
                                />
                                
                                <span className="text-slate-500">-</span>
                                
                                <Input
                                    type="time"
                                    value={item.close_time}
                                    onChange={(e) => handleHourChange(index, 'close_time', e.target.value)}
                                    disabled={!item.is_open}
                                    className="w-28 text-center"
                                />
                            </div>
                        ))}

                        <div className="pt-4 border-t">
                            <Button 
                                onClick={handleSaveHours} 
                                isLoading={isSavingHours}
                                className="bg-indigo-600 hover:bg-indigo-700 w-full flex items-center justify-center gap-2"
                            >
                                <Save size={16} /> {isSavingHours ? 'Salvando...' : 'Salvar Horários de Funcionamento'}
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default Settings;