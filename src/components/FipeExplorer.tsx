import { useEffect, useMemo, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { vehicleDB, VehicleHistory } from '@/lib/localdb';
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from 'recharts';

const API_BASE = 'https://fipe.parallelum.com.br/api/v2';
const STORAGE_TOKEN_KEY = 'fipe_subscription_token';

type VehicleType = 'cars' | 'motorcycles' | 'trucks';

interface Option { value: string; label: string; }

export const FipeExplorer = () => {
  const { toast } = useToast();

  const [token, setToken] = useState<string>(() => localStorage.getItem(STORAGE_TOKEN_KEY) || '');
  const [vehicleType, setVehicleType] = useState<VehicleType>('cars');
  const [referenceList, setReferenceList] = useState<Option[]>([]);
  const [reference, setReference] = useState<string>('');
  const [brands, setBrands] = useState<Option[]>([]);
  const [brand, setBrand] = useState<string>('');
  const [models, setModels] = useState<Option[]>([]);
  const [model, setModel] = useState<string>('');
  const [years, setYears] = useState<Option[]>([]);
  const [year, setYear] = useState<string>('');
  const [history, setHistory] = useState<VehicleHistory | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetch(`${API_BASE}/references`, { headers: { 'X-Subscription-Token': token || '' }})
      .then(r => r.json())
      .then((data: any[]) => {
        const opts = data.map((d: any) => ({ value: String(d.code), label: d.month }));
        setReferenceList(opts);
        if (!reference && opts[0]) setReference(opts[0].value);
      })
      .catch(() => {});
  }, [token]);

  useEffect(() => {
    if (!vehicleType || !token) return;
    setBrand(''); setModel(''); setYear(''); setBrands([]); setModels([]); setYears([]);
    fetch(`${API_BASE}/${vehicleType}/brands?reference=${reference}`, { headers: { 'X-Subscription-Token': token }})
      .then(r => r.json())
      .then((data: any[]) => setBrands(data.map(b => ({ value: String(b.id), label: b.name }))))
      .catch((e) => console.error(e));
  }, [vehicleType, token, reference]);

  useEffect(() => {
    if (!brand) return;
    setModel(''); setYear(''); setModels([]); setYears([]);
    fetch(`${API_BASE}/${vehicleType}/brands/${brand}/models?reference=${reference}`, { headers: { 'X-Subscription-Token': token }})
      .then(r => r.json())
      .then((data: any[]) => setModels(data.map((m: any) => ({ value: String(m.id), label: m.name }))))
      .catch((e) => console.error(e));
  }, [brand, vehicleType, token, reference]);

  useEffect(() => {
    if (!model) return;
    setYear(''); setYears([]);
    fetch(`${API_BASE}/${vehicleType}/brands/${brand}/models/${model}/years?reference=${reference}`, { headers: { 'X-Subscription-Token': token }})
      .then(r => r.json())
      .then((data: any[]) => setYears(data.map((y: any) => ({ value: String(y.code), label: y.name }))))
      .catch((e) => console.error(e));
  }, [model, brand, vehicleType, token, reference]);

  const vehicleKey = useMemo(() => `${vehicleType}:${brand}:${model}:${year}`, [vehicleType, brand, model, year]);

  const saveToken = () => {
    localStorage.setItem(STORAGE_TOKEN_KEY, token);
    toast({ title: 'Token salvo', description: 'Seu token foi salvo com segurança neste navegador.' });
  };

  const fetchInfo = async () => {
    if (!token || !vehicleType || !brand || !model || !year) {
      toast({ title: 'Preencha os campos', description: 'Selecione tipo, marca, modelo, ano e informe o token.', variant: 'destructive' });
      return;
    }
    setIsLoading(true);
    try {
      const url = `${API_BASE}/${vehicleType}/brands/${brand}/models/${model}/years/${year}?reference=${reference}`;
      const res = await fetch(url, { headers: { 'X-Subscription-Token': token }});
      if (!res.ok) throw new Error('Erro ao buscar dados');
      const data = await res.json();
      const record: VehicleHistory = {
        vehicleKey,
        codeFipe: data.codeFipe,
        brand: data.brand,
        model: data.model,
        modelYear: data.modelYear,
        fuel: data.fuel,
        updatedAt: Date.now(),
        priceHistory: Array.isArray(data.priceHistory) ? data.priceHistory : [],
      };
      setHistory(record);
      await vehicleDB.histories.put(record);
      toast({ title: 'Histórico atualizado', description: 'Dados salvos localmente.' });
    } catch (e: any) {
      console.error(e);
      toast({ title: 'Erro', description: e?.message || 'Falha ao obter dados', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const chartData = useMemo(() => {
    if (!history) return [] as any[];
    const toNumber = (brl: string) => Number(brl.replace(/[^0-9,.-]/g, '').replace('.', '').replace(',', '.'));
    return history.priceHistory
      .map(p => ({ name: p.referenceMonth, value: toNumber(p.price) }))
      .reverse();
  }, [history]);

  return (
    <section className="w-full mx-auto max-w-5xl">
      <header className="mb-8 text-center">
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight bg-[var(--gradient-primary)] bg-clip-text text-transparent">Histórico FIPE de Veículos</h1>
        <p className="mt-2 text-muted-foreground">Consulte o histórico de preços da FIPE e visualize em gráficos interativos.</p>
      </header>

      <Card className="p-4 md:p-6 shadow-[var(--shadow-elegant)]">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className="md:col-span-2 flex gap-2">
            <Input value={token} onChange={(e) => setToken(e.target.value)} placeholder="Cole seu X-Subscription-Token" />
            <Button variant="secondary" onClick={saveToken}>Salvar</Button>
          </div>
          <div>
            <Select value={reference} onValueChange={setReference}>
              <SelectTrigger><SelectValue placeholder="Referência" /></SelectTrigger>
              <SelectContent>
                {referenceList.map(r => (<SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Select value={vehicleType} onValueChange={(v: VehicleType) => setVehicleType(v)}>
              <SelectTrigger><SelectValue placeholder="Tipo" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="cars">Carros</SelectItem>
                <SelectItem value="motorcycles">Motos</SelectItem>
                <SelectItem value="trucks">Caminhões</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Select value={brand} onValueChange={setBrand}>
              <SelectTrigger><SelectValue placeholder="Marca" /></SelectTrigger>
              <SelectContent>
                {brands.map(o => (<SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Select value={model} onValueChange={setModel}>
              <SelectTrigger><SelectValue placeholder="Modelo" /></SelectTrigger>
              <SelectContent>
                {models.map(o => (<SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Select value={year} onValueChange={setYear}>
              <SelectTrigger><SelectValue placeholder="Ano" /></SelectTrigger>
              <SelectContent>
                {years.map(o => (<SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>))}
              </SelectContent>
            </Select>
          </div>
          <div className="md:col-span-4 flex justify-end">
            <Button variant="hero" onClick={fetchInfo} disabled={isLoading}>{isLoading ? 'Buscando...' : 'Buscar Histórico'}</Button>
          </div>
        </div>
      </Card>

      {history && (
        <Card className="mt-6 p-4 md:p-6">
          <h2 className="text-xl font-semibold mb-4">{history.brand} • {history.model} • {history.modelYear}</h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" hide={false} angle={-20} interval={0} dy={10} fontSize={12} />
                <YAxis tickFormatter={(v) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} />
                <Tooltip formatter={(v: any) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} />
                <Line type="monotone" dataKey="value" stroke="hsl(var(--primary))" strokeWidth={3} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
      )}
    </section>
  );
};
