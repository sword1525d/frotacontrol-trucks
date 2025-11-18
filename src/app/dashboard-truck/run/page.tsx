'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useFirebase } from '@/firebase';
import { collection, getDocs } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Loader2, Plus, Trash2, ArrowUp, ArrowDown } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

type UserData = {
  id: string;
  name: string;
  companyId: string;
  sectorId: string;
};

type Vehicle = {
  id: string;
  model: string;
};

type StopPoint = string;

const PREDEFINED_STOP_POINTS: StopPoint[] = [
  "PINT. ABS", "PINT. FX ABS", "MOCOM", "INJ. PLÁSTICA", "PINT. PÓ", "USINAGEM", "PINT. TANQUE", "PINT. ALUMÍNIO", 
  "MONT. RODA", "SOLDA CHASSI", "DIV. PEÇAS", "GALVANOPLASTIA", "DOBRADETUBOS", "ESTAM. PRENSA", "MONT. MOTOR", "SOLDA ESCAP.",
  "LINHA MONT.", "PINT. ALT. TEMP.", "SOLDA TANQUE", "FUNDIÇÃO", "SOLDA COMP.", "FÁBR. ASSENTO", "MONT. QUADRI.", "MONT. FILTRO",
  "SOLDA ALUMÍNIO", "FABRICA DE ARO", "MOCOMMSIN1", "PRENSA. COMP."
];

export default function TruckRunPage() {
  const router = useRouter();
  const { firestore } = useFirebase();
  const { toast } = useToast();

  const [user, setUser] = useState<UserData | null>(null);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [selectedVehicle, setSelectedVehicle] = useState('');
  const [mileage, setMileage] = useState('');
  const [stopPoints, setStopPoints] = useState<StopPoint[]>([]);
  const [newPoint, setNewPoint] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const companyId = localStorage.getItem('companyId');
    const sectorId = localStorage.getItem('sectorId');

    if (storedUser && companyId && sectorId) {
      const parsedUser = JSON.parse(storedUser);
      setUser({ ...parsedUser, companyId, sectorId });
    } else {
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Sessão inválida. Faça login novamente.',
      });
      router.push('/login');
    }
  }, [router, toast]);
  
  useEffect(() => {
    if (!firestore || !user) return;

    const fetchVehicles = async () => {
      try {
        const vehiclesCol = collection(firestore, `companies/${user.companyId}/sectors/${user.sectorId}/vehicles`);
        const querySnapshot = await getDocs(vehiclesCol);
        const vehiclesList = querySnapshot.docs
          .map(doc => ({ id: doc.id, ...(doc.data() as any) }))
          .filter(v => v.isTruck)
          .map(v => ({ id: v.id, model: v.model }));
        setVehicles(vehiclesList);
      } catch (error) {
        toast({ variant: 'destructive', title: 'Erro', description: 'Não foi possível carregar os veículos.' });
      } finally {
        setIsLoading(false);
      }
    };
    fetchVehicles();
  }, [firestore, user, toast]);

  const companyStyles = useMemo(() => {
    if (user?.companyId === 'LSL') return { bgColor: 'bg-[#0f2954]', themeColor: '#0f2954', borderColor: 'border-l-[#0f2954]' };
    if (user?.companyId === 'HONDA') return { bgColor: 'bg-[#c62828]', themeColor: '#c62828', borderColor: 'border-l-[#c62828]' };
    return { bgColor: 'bg-primary', themeColor: '#3498db', borderColor: 'border-l-primary' };
  }, [user]);

  useEffect(() => {
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', companyStyles.themeColor);
    document.body.style.backgroundColor = companyStyles.themeColor;
    return () => {
      document.body.style.backgroundColor = '';
    }
  }, [companyStyles]);

  const handleAddPoint = () => {
    if (newPoint && !stopPoints.includes(newPoint)) {
      setStopPoints(prev => [...prev, newPoint]);
      setNewPoint('');
    } else if (stopPoints.includes(newPoint)) {
      toast({ variant: "destructive", description: "Este ponto já foi adicionado." });
    }
  };

  const handleRemovePoint = (indexToRemove: number) => {
    setStopPoints(prev => prev.filter((_, index) => index !== indexToRemove));
  };

  const handleMovePoint = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index > 0) {
      const newPoints = [...stopPoints];
      [newPoints[index - 1], newPoints[index]] = [newPoints[index], newPoints[index - 1]];
      setStopPoints(newPoints);
    } else if (direction === 'down' && index < stopPoints.length - 1) {
      const newPoints = [...stopPoints];
      [newPoints[index + 1], newPoints[index]] = [newPoints[index], newPoints[index + 1]];
      setStopPoints(newPoints);
    }
  };
  
  const handleStartRun = () => {
    if(!selectedVehicle || !mileage || stopPoints.length === 0){
       toast({ variant: 'destructive', title: 'Erro', description: 'Preencha todos os campos e adicione pelo menos um ponto de parada.' });
       return;
    }
    console.log({selectedVehicle, mileage, stopPoints});
    toast({ title: 'Sucesso', description: 'Acompanhamento iniciado!' });
  }

  if (!user || isLoading) {
    return (
      <div className={`flex items-center justify-center min-h-screen ${companyStyles.bgColor}`}>
        <Loader2 className="w-8 h-8 animate-spin text-white" />
      </div>
    );
  }

  return (
    <div className={`flex flex-col min-h-screen font-sans ${companyStyles.bgColor}`}>
      <header className={`p-4 flex items-center justify-between text-white ${companyStyles.bgColor} shadow-lg`}>
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft />
        </Button>
        <h1 className="text-lg font-semibold">Acompanhamento de Caminhão</h1>
        <div className="w-8"></div>
      </header>

      <main className="flex-1 bg-gray-100 rounded-t-3xl p-4 mt-[-20px] shadow-lg overflow-y-auto space-y-6">
        
        {/* Informações do Veículo */}
        <section>
          <h2 className="text-xl font-bold text-gray-800 mb-4">Informações do Veículo</h2>
          <div className="space-y-4">
            <div className="space-y-1">
              <Label htmlFor="veiculo">Veículo</Label>
              <Select value={selectedVehicle} onValueChange={setSelectedVehicle}>
                <SelectTrigger id="veiculo">
                  <SelectValue placeholder="Selecione um veículo" />
                </SelectTrigger>
                <SelectContent>
                  {vehicles.map(v => <SelectItem key={v.id} value={v.id}>{`${v.id} - ${v.model}`}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="quilometragem">Quilometragem Atual</Label>
              <Input id="quilometragem" type="number" placeholder="KM atual do veículo" value={mileage} onChange={e => setMileage(e.target.value)} />
            </div>
          </div>
        </section>

        <Separator />

        {/* Adicionar Pontos */}
        <section>
           <h2 className="text-xl font-bold text-gray-800 mb-4">Pontos de Parada</h2>
            <div className="space-y-4">
                <div className="space-y-1">
                  <Label htmlFor="novo-ponto">Adicionar Ponto</Label>
                  <Select value={newPoint} onValueChange={setNewPoint}>
                    <SelectTrigger id="novo-ponto">
                      <SelectValue placeholder="Selecione um ponto da lista" />
                    </SelectTrigger>
                    <SelectContent>
                      {PREDEFINED_STOP_POINTS.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <Button className="w-full" onClick={handleAddPoint}><Plus className="mr-2 h-4 w-4"/> Adicionar Ponto</Button>
            </div>
        </section>

        {/* Lista de Pontos */}
        {stopPoints.length > 0 && (
          <section>
            <h3 className="text-lg font-semibold text-gray-700 mb-3">Rota ({stopPoints.length})</h3>
            <ul className="space-y-2">
                {stopPoints.map((point, index) => (
                    <li key={index} className="flex items-center justify-between p-3 bg-white rounded-lg shadow-sm group">
                       <span className="font-medium text-gray-800">{index + 1}. {point}</span>
                       <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleMovePoint(index, 'up')} disabled={index === 0}>
                              <ArrowUp className="h-4 w-4"/>
                          </Button>
                           <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleMovePoint(index, 'down')} disabled={index === stopPoints.length - 1}>
                              <ArrowDown className="h-4 w-4"/>
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleRemovePoint(index)}>
                              <Trash2 className="text-destructive h-4 w-4"/>
                          </Button>
                       </div>
                    </li>
                ))}
            </ul>
          </section>
        )}
        <div className="h-20"></div>

        {/* Botão para Iniciar Acompanhamento */}
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-gray-100 border-t border-gray-200">
          <Button 
            className={`w-full text-lg h-14 shadow-lg ${companyStyles.bgColor}`} 
            onClick={handleStartRun}
            disabled={!selectedVehicle || !mileage || stopPoints.length === 0}
          >
            INICIAR ACOMPANHAMENTO
          </Button>
        </div>
      </main>
    </div>
  );
}
