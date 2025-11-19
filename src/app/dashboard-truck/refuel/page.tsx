
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useFirebase } from '@/firebase';
import { collection, getDocs, addDoc, query, where } from 'firebase/firestore';
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
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Loader2, Fuel } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';

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

export default function RefuelPage() {
  const router = useRouter();
  const { firestore, user: authUser } = useFirebase();
  const { toast } = useToast();

  const [user, setUser] = useState<UserData | null>(null);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [selectedVehicle, setSelectedVehicle] = useState('');
  const [liters, setLiters] = useState('');
  const [amount, setAmount] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const companyId = localStorage.getItem('companyId');
    const sectorId = localStorage.getItem('sectorId');

    if (storedUser && companyId && sectorId && authUser) {
      const parsedUser = JSON.parse(storedUser);
      setUser({ ...parsedUser, id: authUser.uid, companyId, sectorId });
    } else if (!authUser && !isLoading) {
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Sessão inválida. Faça login novamente.',
      });
      router.push('/login');
    }
  }, [router, toast, authUser, isLoading]);
  
  useEffect(() => {
    if (!firestore || !user) return;

    const fetchVehicles = async () => {
      try {
        const vehiclesCol = collection(firestore, `companies/${user.companyId}/sectors/${user.sectorId}/vehicles`);
        const q = query(vehiclesCol, where('isTruck', '==', true));
        const querySnapshot = await getDocs(q);
        const vehiclesList = querySnapshot.docs.map(doc => ({ id: doc.id, model: doc.data().model }));
        setVehicles(vehiclesList);
      } catch (error) {
        toast({ variant: 'destructive', title: 'Erro', description: 'Não foi possível carregar os veículos.' });
      } finally {
        setIsLoading(false);
      }
    };
    fetchVehicles();
  }, [firestore, user, toast]);
  
  const handleRegisterRefuel = async () => {
    if(!firestore || !user || !selectedVehicle || !liters || !amount){
       toast({ variant: 'destructive', title: 'Erro', description: 'Preencha todos os campos para registrar.' });
       return;
    }
    
    if (parseFloat(liters) <= 0 || parseFloat(amount) <= 0) {
        toast({ variant: 'destructive', title: 'Valores inválidos', description: 'Litros e valor devem ser maiores que zero.' });
        return;
    }
    
    setIsSubmitting(true);
    try {
      const refuelsCol = collection(firestore, `companies/${user.companyId}/sectors/${user.sectorId}/refuels`);
      
      await addDoc(refuelsCol, {
        driverId: user.id,
        driverName: user.name,
        vehicleId: selectedVehicle,
        liters: parseFloat(liters),
        amount: parseFloat(amount),
        timestamp: new Date(),
      });
      
      toast({ title: 'Sucesso', description: 'Abastecimento registrado com sucesso!' });
      
      router.push('/dashboard-truck');

    } catch(error) {
       console.error("Erro ao registrar abastecimento: ", error);
       toast({ variant: 'destructive', title: 'Erro', description: 'Não foi possível registrar o abastecimento.' });
    } finally {
        setIsSubmitting(false);
    }
  }

  if (isLoading || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-black">
        <div className="container mx-auto max-w-2xl p-4 sm:p-6 lg:p-8">
            <div className="flex items-center gap-4 mb-6">
                <Button variant="outline" size="icon" onClick={() => router.push('/dashboard-truck')}>
                    <ArrowLeft />
                </Button>
                <h1 className="text-2xl font-bold">Registrar Abastecimento</h1>
            </div>
        
            <Card>
                <CardHeader>
                    <CardTitle>Novo Registro</CardTitle>
                    <CardDescription>Preencha as informações do abastecimento abaixo.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-1">
                        <Label htmlFor="veiculo">Veículo</Label>
                        <Select value={selectedVehicle} onValueChange={setSelectedVehicle} disabled={isLoading}>
                            <SelectTrigger id="veiculo">
                            <SelectValue placeholder={isLoading ? "Carregando..." : "Selecione um veículo"} />
                            </SelectTrigger>
                            <SelectContent>
                            {vehicles.map(v => <SelectItem key={v.id} value={v.id}>{`${v.id} - ${v.model}`}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-1">
                        <Label htmlFor="liters">Litros (L)</Label>
                        <Input id="liters" type="number" placeholder="Ex: 50.5" value={liters} onChange={e => setLiters(e.target.value)} />
                    </div>
                    <div className="space-y-1">
                        <Label htmlFor="amount">Valor Total (R$)</Label>
                        <Input id="amount" type="number" placeholder="Ex: 250.00" value={amount} onChange={e => setAmount(e.target.value)} />
                    </div>
                </CardContent>
                <CardFooter>
                    <Button 
                        className="w-full" 
                        onClick={handleRegisterRefuel}
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Fuel className="mr-2 h-4 w-4" />}
                        Registrar Abastecimento
                    </Button>
                </CardFooter>
            </Card>
        </div>
    </div>
  );
}
