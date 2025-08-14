
import { useEffect, useMemo, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { vehicleDB, VehicleHistory } from '@/lib/localdb';
import { LineChart as LineChartIcon } from 'lucide-react';
import { PriceHistoryChart } from './fipe/PriceHistoryChart';
import { DepreciationTable } from './fipe/DepreciationTable';
import { DEFAULT_FIPE_TOKEN } from '@/config/fipe';

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

  const effectiveToken = useMemo(() => (token?.trim() || DEFAULT_FIPE_TOKEN), [token]);

  useEffect(() => {
    fetch(`${API_BASE}/references`, { headers: { 'X-Subscription-Token': effectiveToken }})
      .then(r => r.json())
      .then((data: any) => {
        if (!Array.isArray(data)) {
          console.error('Falha ao carregar referências', data);
          setReferenceList([]);
          toast({
            title: 'Falha ao carregar referências',
            description: String((data && (data.error || data.message)) || 'Verifique o token e tente novamente.'),
            variant: 'destructive',
          });
        
          return;
        }
        const opts = data.map((d: any) => ({ value: String(d.code), label: d.month }));
        setReferenceList(opts);
        if (!reference && opts[0]) setReference(opts[0].value);
      })
      .catch((e) => console.error(e));
  }, [effectiveToken]);

  useEffect(() => {
    if (!vehicleType) return;
    setBrand(''); setModel(''); setYear(''); setBrands([]); setModels([]); setYears([]);
    fetch(`${API_BASE}/${vehicleType}/brands?reference=${reference}`, { headers: { 'X-Subscription-Token': effectiveToken }})
      .then(r => r.json())
      .then((data: any) => {
        if (!Array.isArray(data)) {
          console.error('Falha ao carregar marcas', data);
          setBrands([]);
          toast({
            title: 'Falha ao carregar marcas',
            description: String((data && (data.error || data.message)) || 'Verifique o token e tente novamente.'),
            variant: 'destructive',
          });
          return;
        }
        setBrands(data.map((b: any) => ({ value: String(b.code ?? b.id), label: b.name })));
      })
      .catch((e) => console.error(e));
  }, [vehicleType, effectiveToken, reference]);

  useEffect(() => {
    if (!brand) return;
    setModel(''); setYear(''); setModels([]); setYears([]);
    fetch(`${API_BASE}/${vehicleType}/brands/${brand}/models?reference=${reference}`, { headers: { 'X-Subscription-Token': effectiveToken }})
      .then(r => r.json())
      .then((data: any) => {
        if (!Array.isArray(data)) {
          console.error('Falha ao carregar modelos', data);
          setModels([]);
          toast({
            title: 'Falha ao carregar modelos',
            description: String((data && (data.error || data.message)) || 'Verifique o token e tente novamente.'),
            variant: 'destructive',
          });
          return;
        }
        setModels(data.map((m: any) => ({ value: String(m.id ?? m.code), label: m.name })));
      })
      .catch((e) => console.error(e));
  }, [brand, vehicleType, effectiveToken, reference]);

  useEffect(() => {
    if (!model) return;
    setYear(''); setYears([]);
    fetch(`${API_BASE}/${vehicleType}/brands/${brand}/models/${model}/years?reference=${reference}`, { headers: { 'X-Subscription-Token': effectiveToken }})
      .then(r => r.json())
      .then((data: any) => {
        if (!Array.isArray(data)) {
          console.error('Falha ao carregar anos', data);
          setYears([]);
          toast({
            title: 'Falha ao carregar anos',
            description: String((data && (data.error || data.message)) || 'Verifique o token e tente novamente.'),
            variant: 'destructive',
          });
          return;
        }
        setYears(data.map((y: any) => ({ value: String(y.code), label: y.name })));
      })
      .catch((e) => console.error(e));
  }, [model, brand, vehicleType, effectiveToken, reference]);

  const vehicleKey = useMemo(() => `${vehicleType}:${brand}:${model}:${year}`, [vehicleType, brand, model, year]);

  const saveToken = () => {
    const t = token.trim();
    if (t) {
      localStorage.setItem(STORAGE_TOKEN_KEY, t);
      toast({ title: 'Token salvo', description: 'Seu token foi salvo neste navegador.' });
    } else {
      localStorage.removeItem(STORAGE_TOKEN_KEY);
      toast({ title: 'Usando token padrão', description: 'Nenhum token informado. Usaremos o embutido por padrão.' });
    }
  };

  const fetchInfo = async () => {
    if (!vehicleType || !brand || !model || !year) {
      toast({ title: 'Preencha os campos', description: 'Selecione tipo, marca, modelo e ano.', variant: 'destructive' });
      return;
    }
    setIsLoading(true);
    try {
      // Extrair o ano do modelo selecionado
      const selectedYear = years.find(y => y.value === year);
      const modelYear = selectedYear ? parseInt(selectedYear.label) : new Date().getFullYear();
      
      // Encontrar referência de janeiro do ano anterior ao modelo
      const targetYear = modelYear - 1;
      const startReferenceIndex = referenceList.findIndex(ref => 
        ref.label.includes(`janeiro/${targetYear}`)
      );
      
      // Encontrar a referência atual para limitar a busca
      const currentReferenceIndex = referenceList.findIndex(ref => ref.value === reference);
      
      // Se não encontrar janeiro do ano anterior, procurar a primeira referência do ano anterior
      let actualStartIndex = startReferenceIndex;
      if (actualStartIndex === -1) {
        actualStartIndex = referenceList.findIndex(ref => ref.label.includes(`/${targetYear}`));
      }
      
      // Se ainda não encontrar, não buscar histórico muito antigo
      if (actualStartIndex === -1 || currentReferenceIndex === -1) {
        throw new Error(`Não há dados disponíveis a partir de ${targetYear} para este veículo`);
      }
      
      // Buscar apenas do período válido (ano anterior até atual)
      const searchReferences = referenceList.slice(actualStartIndex, currentReferenceIndex + 1);
      
      toast({ 
        title: 'Buscando histórico completo', 
        description: `Procurando dados desde ${targetYear} para ${modelYear}...` 
      });
      
      const historicalData = [];
      let firstFoundIndex = -1;
      
      // Primeira fase: encontrar o primeiro registro disponível
      for (let i = 0; i < searchReferences.length; i++) {
        const ref = searchReferences[i];
        try {
          const url = `${API_BASE}/${vehicleType}/brands/${brand}/models/${model}/years/${year}?reference=${ref.value}`;
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 3000); // 3s timeout
          
          const res = await fetch(url, { 
            headers: { 'X-Subscription-Token': effectiveToken },
            signal: controller.signal
          });
          clearTimeout(timeoutId);
          
          if (res.ok) {
            const data = await res.json();
            if (data.price && data.price !== 'R$ 0,00') {
              firstFoundIndex = i;
              historicalData.push({
                referenceMonth: ref.label,
                price: data.price
              });
              break;
            }
          }
        } catch (e) {
          if (e.name !== 'AbortError') {
            console.error(`Erro ao buscar referência ${ref.label}:`, e);
          }
        }
        
        // Dar feedback visual do progresso
        if (i % 5 === 0 && i > 0) {
          toast({ 
            title: 'Buscando...', 
            description: `Verificando ${ref.label}...` 
          });
        }
      }
      
      if (firstFoundIndex === -1) {
        throw new Error('Nenhum histórico encontrado para este veículo');
      }
      
      // Segunda fase: buscar todos os meses desde o primeiro encontrado até o atual
      const remainingRefs = searchReferences.slice(firstFoundIndex + 1, 24); // Máximo 24 meses
      
      const promises = remainingRefs.map(async (ref) => {
        try {
          const url = `${API_BASE}/${vehicleType}/brands/${brand}/models/${model}/years/${year}?reference=${ref.value}`;
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 3000);
          
          const res = await fetch(url, { 
            headers: { 'X-Subscription-Token': effectiveToken },
            signal: controller.signal
          });
          clearTimeout(timeoutId);
          
          if (res.ok) {
            const data = await res.json();
            if (data.price && data.price !== 'R$ 0,00') {
              return {
                referenceMonth: ref.label,
                price: data.price
              };
            }
          }
        } catch (e) {
          if (e.name !== 'AbortError') {
            console.error(`Erro ao buscar referência ${ref.label}:`, e);
          }
        }
        return null;
      });
      
      const results = await Promise.all(promises);
      historicalData.push(...results.filter(Boolean));

      // Buscar dados atuais
      const url = `${API_BASE}/${vehicleType}/brands/${brand}/models/${model}/years/${year}?reference=${reference}`;
      const res = await fetch(url, { headers: { 'X-Subscription-Token': effectiveToken }});
      if (!res.ok) throw new Error('Erro ao buscar dados');
      const data = await res.json();
      
      const record: VehicleHistory = {
        vehicleKey,
        codeFipe: data.codeFipe || '',
        brand: data.brand || '',
        model: data.model || '',
        modelYear: data.modelYear || 0,
        fuel: data.fuel || '',
        updatedAt: Date.now(),
        priceHistory: historicalData.length > 0 ? historicalData : [
          {
            referenceMonth: referenceList.find(r => r.value === reference)?.label || 'Atual',
            price: data.price || 'R$ 0,00'
          }
        ],
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
    if (!history || !history.priceHistory) return [];
    
    const toNumber = (brl: string) => {
      if (!brl || typeof brl !== 'string') return 0;
      
      // Remove "R$", espaços e converte vírgulas em pontos
      const cleanPrice = brl
        .replace(/R\$\s?/g, '')  // Remove R$ e espaços
        .replace(/\./g, '')      // Remove pontos (milhares)
        .replace(',', '.')       // Converte vírgula decimal em ponto
        .trim();
      
      const number = parseFloat(cleanPrice);
      return isNaN(number) ? 0 : number;
    };
    
    const chronological = history.priceHistory
      .map((p) => ({ 
        name: p.referenceMonth, 
        value: toNumber(p.price),
        formattedValue: p.price,
      }))
      .filter((p) => p.value > 0)
      .reverse();

    return chronological.map((item, idx) => {
      const prev = idx > 0 ? chronological[idx - 1].value : undefined;
      const pctChange = prev && prev !== 0 ? (item.value - prev) / prev : undefined;
      return { ...item, prevValue: prev, pctChange };
    });
  }, [history]);

  return (
    <section className="w-full mx-auto max-w-5xl animate-fade-in">
      <header className="mb-8 text-center">
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight bg-[var(--gradient-primary)] bg-clip-text text-transparent">Histórico FIPE de Veículos</h1>
        <p className="mt-2 text-muted-foreground">Consulte o histórico de preços da FIPE e visualize em gráficos interativos.</p>
      </header>

      <Card className="p-4 md:p-6 shadow-[var(--shadow-elegant)] animate-enter">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className="md:col-span-2 flex gap-2">
            <Input type="password" value={token} onChange={(e) => setToken(e.target.value)} placeholder="Use o token padrão ou cole o seu X-Subscription-Token" />
            <Button variant="secondary" onClick={saveToken}>Salvar</Button>
          </div>
          <div>
            <Select value={reference} onValueChange={setReference}>
              <SelectTrigger><SelectValue placeholder="Referência" /></SelectTrigger>
              <SelectContent>
                {referenceList.map((r, idx) => (<SelectItem key={`${r.value}-${idx}`} value={r.value}>{r.label}</SelectItem>))}
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
                {brands.map((o, idx) => (<SelectItem key={`${o.value}-${idx}`} value={o.value}>{o.label}</SelectItem>))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Select value={model} onValueChange={setModel}>
              <SelectTrigger><SelectValue placeholder="Modelo" /></SelectTrigger>
              <SelectContent>
                {models.map((o, idx) => (<SelectItem key={`${o.value}-${idx}`} value={o.value}>{o.label}</SelectItem>))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Select value={year} onValueChange={setYear}>
              <SelectTrigger><SelectValue placeholder="Ano" /></SelectTrigger>
              <SelectContent>
                {years.map((o, idx) => (<SelectItem key={`${o.value}-${idx}`} value={o.value}>{o.label}</SelectItem>))}
              </SelectContent>
            </Select>
          </div>
          <div className="md:col-span-4 flex justify-end">
            <Button
              variant="cta"
              size="lg"
              className="hover-scale shadow-[var(--shadow-glow)]"
              onClick={fetchInfo}
              disabled={isLoading}
            >
              <LineChartIcon className="mr-2 h-5 w-5" />
              {isLoading ? 'Buscando...' : 'Buscar Histórico'}
            </Button>
          </div>
        </div>
      </Card>

      {history && (
        <>
          <Card className="mt-6 p-4 md:p-6 animate-enter">
            <h2 className="text-xl font-semibold mb-4">{history.brand} • {history.model} • {history.modelYear}</h2>
            {chartData.length > 0 ? (
              <PriceHistoryChart data={chartData} />
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <p>Nenhum dado de preço encontrado para este veículo.</p>
              </div>
            )}
          </Card>

          {chartData.length > 0 && (
            <Card className="mt-6 p-4 md:p-6 animate-enter">
              <h3 className="text-lg font-semibold mb-4">Desvalorização mês a mês</h3>
              <DepreciationTable data={chartData} />
            </Card>
          )}
        </>
      )}
    </section>
  );
};
