import React, { useState } from 'react';
import { FileText } from 'lucide-react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { DataProvider } from './contexts/DataContext';
import Layout from './components/Layout';
import LoginForm from './components/auth/LoginForm';
import RegisterForm from './components/auth/RegisterForm';
import DonorDashboard from './components/pages/DonorDashboard';
import ReceiverDashboard from './components/pages/ReceiverDashboard';
import VolunteerDashboard from './components/pages/VolunteerDashboard';
import AddFoodForm from './components/food/AddFoodForm';
import FoodItemCard from './components/food/FoodItemCard';
import ConsolidatedLotCard from './components/consolidated/ConsolidatedLotCard';
import LogisticsQuoteCard from './components/logistics/LogisticsQuoteCard';
import TaxCertificateCard from './components/tax/TaxCertificateCard';
import { useData } from './contexts/DataContext';

const AppContent: React.FC = () => {
  const { user } = useAuth();
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');

  if (!user) {
    return authMode === 'login' ? (
      <LoginForm onSwitchToRegister={() => setAuthMode('register')} />
    ) : (
      <RegisterForm onSwitchToLogin={() => setAuthMode('login')} />
    );
  }

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        if (user.role === 'donor') {
          return <DonorDashboard onPageChange={setCurrentPage} />;
        } else if (user.role === 'receiver') {
          return <ReceiverDashboard onPageChange={setCurrentPage} />;
        } else if (user.role === 'volunteer') {
          return <VolunteerDashboard onPageChange={setCurrentPage} />;
        }
        return <DonorDashboard onPageChange={setCurrentPage} />;

      case 'add-food':
        return <AddFoodForm />;

      case 'consolidated-lots':
        return <ConsolidatedLotsPage />;

      case 'donations':
        return <DonationsPage />;

      case 'available-food':
        return <AvailableFoodPage />;

      case 'my-reservations':
        return <MyReservationsPage />;

      case 'routes':
        return <RoutesPage />;

      case 'available-deliveries':
        return <AvailableDeliveriesPage />;

      case 'tax-certificates':
        return <TaxCertificatesPage />;

      default:
        return <DonorDashboard onPageChange={setCurrentPage} />;
    }
  };

  return (
    <Layout currentPage={currentPage} onPageChange={setCurrentPage}>
      {renderPage()}
    </Layout>
  );
};

// Páginas adicionales
const ConsolidatedLotsPage: React.FC = () => {
  const { getAvailableConsolidatedLots, reserveConsolidatedLot, joinSharedLogistics, getLogisticsQuotes, logisticsProviders } = useData();
  const { user } = useAuth();
  
  const availableLots = getAvailableConsolidatedLots();
  const [selectedLot, setSelectedLot] = useState<string | null>(null);
  const [showQuotes, setShowQuotes] = useState(false);

  const handleReserveLot = (lotId: string, logisticsOption: 'beneficiary_covers' | 'shared_logistics') => {
    if (user) {
      reserveConsolidatedLot(lotId, user.id, logisticsOption);
    }
  };

  const handleJoinShared = (lotId: string) => {
    if (user) {
      joinSharedLogistics(lotId, user.id);
    }
  };

  const handleViewQuotes = (lotId: string) => {
    setSelectedLot(lotId);
    setShowQuotes(true);
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Lotes Consolidados</h1>
        <p className="mt-2 text-gray-600">
          Alimentos agrupados por zona para optimizar la logística
        </p>
      </div>

      {showQuotes && selectedLot && (
        <div className="mb-8 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Cotizaciones de Logística</h2>
            <button
              onClick={() => setShowQuotes(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {getLogisticsQuotes(selectedLot).map(quote => {
              const provider = logisticsProviders.find(p => p.id === quote.providerId);
              return provider ? (
                <LogisticsQuoteCard
                  key={quote.id}
                  quote={quote}
                  provider={provider}
                />
              ) : null;
            })}
          </div>
        </div>
      )}

      {availableLots.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {availableLots.map(lot => (
            <ConsolidatedLotCard
              key={lot.id}
              lot={lot}
              userRole={user?.role}
              onReserve={handleReserveLot}
              onJoinShared={handleJoinShared}
              logisticsQuotes={getLogisticsQuotes(lot.id)}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-gray-500">No hay lotes consolidados disponibles en este momento</p>
        </div>
      )}
    </div>
  );
};

const TaxCertificatesPage: React.FC = () => {
  const { taxCertificates, generateTaxCertificate, donations } = useData();
  const { user } = useAuth();
  
  const myCertificates = taxCertificates.filter(cert => cert.donorId === user?.id);
  const myCompletedDonations = donations.filter(d => 
    d.donorId === user?.id && 
    d.status === 'delivered' && 
    !d.taxCertificateId
  );

  const handleGenerateCertificate = () => {
    if (user && myCompletedDonations.length > 0) {
      generateTaxCertificate(user.id, myCompletedDonations.map(d => d.id));
    }
  };

  const handleDownload = (certificateId: string) => {
    // Simular descarga
    alert('Descargando certificado PDF...');
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Certificados Fiscales</h1>
        <p className="mt-2 text-gray-600">
          Gestiona tus certificados de donación para deducciones fiscales
        </p>
      </div>

      {user?.role === 'donor' && myCompletedDonations.length > 0 && (
        <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-medium text-blue-900">
                Tienes {myCompletedDonations.length} donaciones sin certificar
              </h3>
              <p className="text-blue-700">
                Genera tu certificado fiscal para obtener deducciones impositivas
              </p>
            </div>
            <button
              onClick={handleGenerateCertificate}
              className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700"
            >
              Generar Certificado
            </button>
          </div>
        </div>
      )}

      {myCertificates.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {myCertificates.map(certificate => (
            <TaxCertificateCard
              key={certificate.id}
              certificate={certificate}
              onDownload={handleDownload}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No tienes certificados fiscales
          </h3>
          <p className="text-gray-500">
            Los certificados se generan automáticamente cuando completas donaciones
          </p>
        </div>
      )}
    </div>
  );
};

const DonationsPage: React.FC = () => {
  const { getFoodItemsByDonor } = useData();
  const { user } = useAuth();
  
  const myDonations = user ? getFoodItemsByDonor(user.id) : [];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Mis Donaciones</h1>
        <p className="mt-2 text-gray-600">
          Gestiona todos los alimentos que has publicado para donación
        </p>
      </div>

      {myDonations.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {myDonations.map(item => (
            <FoodItemCard
              key={item.id}
              item={item}
              userRole="donor"
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-gray-500">No tienes donaciones publicadas</p>
        </div>
      )}
    </div>
  );
};

const AvailableFoodPage: React.FC = () => {
  const { getAvailableFoodItems, reserveFoodItem } = useData();
  const { user } = useAuth();
  
  const availableItems = getAvailableFoodItems();

  const handleReserve = (itemId: string) => {
    if (user) {
      reserveFoodItem(itemId, user.id);
    }
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Alimentos Disponibles</h1>
        <p className="mt-2 text-gray-600">
          Encuentra alimentos disponibles para tu organización
        </p>
      </div>

      {availableItems.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {availableItems.map(item => (
            <FoodItemCard
              key={item.id}
              item={item}
              userRole="receiver"
              onReserve={handleReserve}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-gray-500">No hay alimentos disponibles en este momento</p>
        </div>
      )}
    </div>
  );
};

const MyReservationsPage: React.FC = () => {
  const { getFoodItemsByReceiver } = useData();
  const { user } = useAuth();
  
  const myReservations = user ? getFoodItemsByReceiver(user.id) : [];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Mis Reservas</h1>
        <p className="mt-2 text-gray-600">
          Alimentos que has reservado para tu organización
        </p>
      </div>

      {myReservations.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {myReservations.map(item => (
            <FoodItemCard
              key={item.id}
              item={item}
              userRole="receiver"
              showActions={false}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-gray-500">No tienes reservas activas</p>
        </div>
      )}
    </div>
  );
};

const RoutesPage: React.FC = () => {
  const { getDonationsByVolunteer, foodItems, updateDonationStatus } = useData();
  const { user } = useAuth();
  
  const myDeliveries = user ? getDonationsByVolunteer(user.id) : [];

  const handleStatusUpdate = (donationId: string, status: any) => {
    updateDonationStatus(donationId, status);
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Mis Rutas</h1>
        <p className="mt-2 text-gray-600">
          Gestiona tus entregas asignadas
        </p>
      </div>

      {myDeliveries.length > 0 ? (
        <div className="space-y-6">
          {myDeliveries.map(delivery => {
            const item = foodItems.find(f => f.id === delivery.foodItemId);
            if (!item) return null;

            return (
              <div key={delivery.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{item.name}</h3>
                    <p className="text-gray-600">{item.quantity} {item.unit}</p>
                  </div>
                  <span className={`px-3 py-1 text-sm font-medium rounded-full ${
                    delivery.status === 'delivered' ? 'bg-green-100 text-green-800' :
                    delivery.status === 'in_transit' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-blue-100 text-blue-800'
                  }`}>
                    {delivery.status === 'delivered' ? 'Entregado' :
                     delivery.status === 'in_transit' ? 'En camino' :
                     'Confirmado'}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="text-sm font-medium text-gray-700">Recoger en:</p>
                    <p className="text-sm text-gray-600">{item.donorAddress}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700">Entregar a:</p>
                    <p className="text-sm text-gray-600">Organización receptora</p>
                  </div>
                </div>

                {delivery.status !== 'delivered' && (
                  <div className="flex space-x-2">
                    {delivery.status === 'confirmed' && (
                      <button
                        onClick={() => handleStatusUpdate(delivery.id, 'in_transit')}
                        className="px-4 py-2 bg-yellow-600 text-white rounded-md text-sm font-medium hover:bg-yellow-700"
                      >
                        Iniciar Entrega
                      </button>
                    )}
                    {delivery.status === 'in_transit' && (
                      <button
                        onClick={() => handleStatusUpdate(delivery.id, 'delivered')}
                        className="px-4 py-2 bg-green-600 text-white rounded-md text-sm font-medium hover:bg-green-700"
                      >
                        Marcar como Entregado
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-gray-500">No tienes entregas asignadas</p>
        </div>
      )}
    </div>
  );
};

const AvailableDeliveriesPage: React.FC = () => {
  const { donations, foodItems, assignVolunteer } = useData();
  const { user } = useAuth();
  
  const availableDeliveries = donations.filter(donation => 
    !donation.volunteerId && donation.status === 'confirmed'
  );

  const handleTakeDelivery = (donationId: string) => {
    if (user) {
      assignVolunteer(donationId, user.id);
    }
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Entregas Disponibles</h1>
        <p className="mt-2 text-gray-600">
          Toma entregas disponibles y ayuda a conectar donantes con receptores
        </p>
      </div>

      {availableDeliveries.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {availableDeliveries.map(delivery => {
            const item = foodItems.find(f => f.id === delivery.foodItemId);
            if (!item) return null;

            return (
              <div key={delivery.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{item.name}</h3>
                <p className="text-gray-600 mb-4">{item.quantity} {item.unit}</p>
                
                <div className="space-y-2 mb-4">
                  <p className="text-sm"><strong>Recoger en:</strong> {item.donorAddress}</p>
                  <p className="text-sm"><strong>Vence:</strong> {new Date(item.expirationDate).toLocaleDateString('es-AR')}</p>
                </div>

                <button
                  onClick={() => handleTakeDelivery(delivery.id)}
                  className="w-full bg-green-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-green-700"
                >
                  Tomar Entrega
                </button>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-gray-500">No hay entregas disponibles en este momento</p>
        </div>
      )}
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <DataProvider>
        <AppContent />
      </DataProvider>
    </AuthProvider>
  );
}

export default App;