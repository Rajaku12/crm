import React, { useState, useEffect, useCallback } from 'react';
import { 
    getBookingPayments, createBookingPayment, updateBookingPayment, deleteBookingPayment,
    getReceipts, downloadReceipt, getPaymentSchedules, createPaymentSchedule,
    getLedgers, getRefunds, createRefund, approveRefund, processRefund,
    getBankReconciliations, getProjects, getTowers, getFloors, getUnits, getDeals, getClients,
    approveBookingPayment, clearCheque, generateReceipt, sendReceipt
} from '../services/apiService';
import { BookingPayment, Receipt, PaymentSchedule, Ledger, Refund, BankReconciliation, Project, Tower, Floor, Unit, Deal, Client } from '../types';
import { useToast } from '../contexts/ToastContext';

type PaymentTab = 'overview' | 'booking' | 'receipts' | 'schedules' | 'ledger' | 'refunds' | 'reconciliation';

export const Payments: React.FC = () => {
    // Initialize all state first before any hooks that might fail
    const [activeTab, setActiveTab] = useState<PaymentTab>('overview');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    
    // Safely get toast context with fallback - must be after state initialization
    let showToast: (message: string, type?: 'success' | 'error') => void;
    try {
        const toastContext = useToast();
        showToast = toastContext?.showToast || ((msg: string, type?: 'success' | 'error') => {
            console.log(`Toast [${type || 'info'}]: ${msg}`);
        });
    } catch (error) {
        console.error('Error getting toast context:', error);
        showToast = (message: string, type?: 'success' | 'error') => {
            console.log(`Toast [${type || 'info'}]: ${message}`);
        };
    }
    
    // Data states
    const [bookingPayments, setBookingPayments] = useState<BookingPayment[]>([]);
    const [receipts, setReceipts] = useState<Receipt[]>([]);
    const [paymentSchedules, setPaymentSchedules] = useState<PaymentSchedule[]>([]);
    const [ledgers, setLedgers] = useState<Ledger[]>([]);
    const [refunds, setRefunds] = useState<Refund[]>([]);
    const [bankReconciliations, setBankReconciliations] = useState<BankReconciliation[]>([]);
    
    // Form states
    const [showBookingForm, setShowBookingForm] = useState(false);
    const [showScheduleForm, setShowScheduleForm] = useState(false);
    const [showRefundForm, setShowRefundForm] = useState(false);
    
    // Project structure
    const [projects, setProjects] = useState<Project[]>([]);
    const [towers, setTowers] = useState<Tower[]>([]);
    const [floors, setFloors] = useState<Floor[]>([]);
    const [units, setUnits] = useState<Unit[]>([]);
    const [deals, setDeals] = useState<Deal[]>([]);
    const [clients, setClients] = useState<Client[]>([]);
    
    // Selected filters
    const [selectedProject, setSelectedProject] = useState<number | null>(null);
    const [selectedTower, setSelectedTower] = useState<number | null>(null);
    const [selectedFloor, setSelectedFloor] = useState<number | null>(null);

    // Load initial data with error handling
    useEffect(() => {
        let isMounted = true;
        
        const loadData = async () => {
            try {
                if (isMounted) {
                    await loadOverviewData();
                    await loadProjects();
                    await loadDeals();
                    await loadClients();
                }
            } catch (error) {
                console.error('Error in initial data load:', error);
                if (isMounted) {
                    setError('Failed to initialize payment data. Please refresh the page.');
                }
            }
        };
        
        loadData();
        
        return () => {
            isMounted = false;
        };
    }, []);

    // Load towers when project changes
    useEffect(() => {
        if (selectedProject) {
            loadTowers(selectedProject);
        } else {
            setTowers([]);
            setFloors([]);
            setUnits([]);
        }
    }, [selectedProject]);

    // Load floors when tower changes
    useEffect(() => {
        if (selectedTower) {
            loadFloors(selectedTower);
        } else {
            setFloors([]);
            setUnits([]);
        }
    }, [selectedTower]);

    // Load units when floor changes
    useEffect(() => {
        if (selectedFloor) {
            loadUnits(selectedFloor);
        } else {
            setUnits([]);
        }
    }, [selectedFloor]);

    const loadOverviewData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const [bookings, receiptsData, schedules, ledgerData, refundsData, reconciliations] = await Promise.allSettled([
                getBookingPayments().catch((e) => { console.error('Error loading bookings:', e); return []; }),
                getReceipts().catch((e) => { console.error('Error loading receipts:', e); return []; }),
                getPaymentSchedules().catch((e) => { console.error('Error loading schedules:', e); return []; }),
                getLedgers().catch((e) => { console.error('Error loading ledgers:', e); return []; }),
                getRefunds().catch((e) => { console.error('Error loading refunds:', e); return []; }),
                getBankReconciliations().catch((e) => { console.error('Error loading reconciliations:', e); return []; })
            ]);
            
            // Safely extract data from Promise.allSettled results
            const safeGet = <T,>(result: PromiseSettledResult<T>, defaultValue: T[] = []): T[] => {
                if (result.status === 'fulfilled') {
                    const value = result.value;
                    // Handle both array and object with results property
                    if (Array.isArray(value)) {
                        return value;
                    } else if (value && typeof value === 'object' && 'results' in value && Array.isArray(value.results)) {
                        return value.results as T[];
                    }
                    return defaultValue;
                }
                return defaultValue;
            };
            
            setBookingPayments(safeGet(bookings));
            setReceipts(safeGet(receiptsData));
            setPaymentSchedules(safeGet(schedules));
            setLedgers(safeGet(ledgerData));
            setRefunds(safeGet(refundsData));
            setBankReconciliations(safeGet(reconciliations));
        } catch (error: any) {
            console.error('Error loading payment data:', error);
            const errorMessage = error?.message || 'Failed to load payment data. Please refresh the page.';
            setError(errorMessage);
            showToast(errorMessage, 'error');
        } finally {
            setLoading(false);
        }
    }, [showToast]);

    const loadProjects = async () => {
        try {
            const data = await getProjects();
            setProjects(Array.isArray(data) ? data : (data?.results || []));
        } catch (error: any) {
            console.error('Error loading projects:', error);
            // Don't show toast for non-critical data
        }
    };

    const loadTowers = async (projectId: number) => {
        try {
            const data = await getTowers(projectId);
            setTowers(data);
        } catch (error: any) {
            showToast('Failed to load towers', 'error');
        }
    };

    const loadFloors = async (towerId: number) => {
        try {
            const data = await getFloors(towerId);
            setFloors(data);
        } catch (error: any) {
            showToast('Failed to load floors', 'error');
        }
    };

    const loadUnits = async (floorId: number) => {
        try {
            const data = await getUnits(floorId);
            setUnits(data);
        } catch (error: any) {
            showToast('Failed to load units', 'error');
        }
    };

    const loadDeals = async () => {
        try {
            const data = await getDeals();
            setDeals(Array.isArray(data) ? data : (data?.results || []));
        } catch (error: any) {
            console.error('Error loading deals:', error);
            // Don't show toast for non-critical data
        }
    };

    const loadClients = async () => {
        try {
            const data = await getClients();
            setClients(Array.isArray(data) ? data : (data?.results || []));
        } catch (error: any) {
            console.error('Error loading clients:', error);
            // Don't show toast for non-critical data
        }
    };

    // Calculate statistics with safe defaults
    const stats = {
        totalBookings: bookingPayments?.length || 0,
        totalAmount: bookingPayments?.reduce((sum, b) => sum + (b?.amount || 0), 0) || 0,
        pendingBookings: bookingPayments?.filter(b => b?.status === 'Pending' || b?.status === 'pending').length || 0,
        clearedBookings: bookingPayments?.filter(b => b?.status === 'Cleared' || b?.status === 'cleared').length || 0,
        totalReceipts: receipts?.length || 0,
        totalRefunds: refunds?.length || 0,
        pendingRefunds: refunds?.filter(r => r?.status === 'Pending' || r?.status === 'pending').length || 0,
    };

    const tabs = [
        { id: 'overview' as PaymentTab, label: 'Overview', icon: '📊' },
        { id: 'booking' as PaymentTab, label: 'Booking Payments', icon: '💰' },
        { id: 'receipts' as PaymentTab, label: 'Receipts', icon: '🧾' },
        { id: 'schedules' as PaymentTab, label: 'Payment Schedules', icon: '📅' },
        { id: 'ledger' as PaymentTab, label: 'Ledger', icon: '📖' },
        { id: 'refunds' as PaymentTab, label: 'Refunds', icon: '↩️' },
        { id: 'reconciliation' as PaymentTab, label: 'Bank Reconciliation', icon: '🏦' },
    ];

    // Render component
    return (
        <div className="p-6">
            <div className="mb-6">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Payment Management</h1>
                <p className="text-gray-600">Manage bookings, receipts, schedules, and payments</p>
            </div>

            {/* Error Display */}
            {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                    <div className="flex items-center justify-between">
                        <p className="text-red-800">{error}</p>
                        <button
                            onClick={() => {
                                setError(null);
                                loadOverviewData();
                            }}
                            className="text-red-600 hover:text-red-800 underline text-sm"
                        >
                            Retry
                        </button>
                    </div>
                </div>
            )}

            {/* Tabs */}
            <div className="border-b border-gray-200 mb-6">
                <nav className="flex space-x-8">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`py-4 px-1 border-b-2 font-medium text-sm ${
                                activeTab === tab.id
                                    ? 'border-primary-500 text-primary-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }`}
                        >
                            <span className="mr-2">{tab.icon}</span>
                            {tab.label}
                        </button>
                    ))}
                </nav>
            </div>

            {/* Tab Content */}
            {loading && (
                <div className="flex justify-center items-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
                    <span className="ml-4 text-gray-600">Loading payment data...</span>
                </div>
            )}

            {!loading && !error && (
                <>
                    {activeTab === 'overview' && (
                        <OverviewTab 
                            stats={stats}
                            bookingPayments={bookingPayments}
                            receipts={receipts}
                            refunds={refunds}
                        />
                    )}

                    {activeTab === 'booking' && (
                        <BookingPaymentsTab
                            bookingPayments={bookingPayments}
                            onRefresh={loadOverviewData}
                            projects={projects}
                            towers={towers}
                            floors={floors}
                            units={units}
                            deals={deals}
                            clients={clients}
                            selectedProject={selectedProject}
                            selectedTower={selectedTower}
                            selectedFloor={selectedFloor}
                            onProjectChange={setSelectedProject}
                            onTowerChange={setSelectedTower}
                            onFloorChange={setSelectedFloor}
                        />
                    )}

                    {activeTab === 'receipts' && (
                        <ReceiptsTab receipts={receipts} onRefresh={loadOverviewData} />
                    )}

                    {activeTab === 'schedules' && (
                        <PaymentSchedulesTab
                            schedules={paymentSchedules}
                            deals={deals}
                            onRefresh={loadOverviewData}
                        />
                    )}

                    {activeTab === 'ledger' && (
                        <LedgerTab ledgers={ledgers} onRefresh={loadOverviewData} />
                    )}

                    {activeTab === 'refunds' && (
                        <RefundsTab
                            refunds={refunds}
                            deals={deals}
                            onRefresh={loadOverviewData}
                        />
                    )}

                    {activeTab === 'reconciliation' && (
                        <BankReconciliationTab
                            reconciliations={bankReconciliations}
                            onRefresh={loadOverviewData}
                        />
                    )}
                </>
            )}
        </div>
    );
};

// Overview Tab Component
const OverviewTab: React.FC<{
    stats: any;
    bookingPayments: BookingPayment[];
    receipts: Receipt[];
    refunds: Refund[];
}> = ({ stats, bookingPayments, receipts, refunds }) => {
    return (
        <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600">Total Bookings</p>
                            <p className="text-2xl font-bold text-gray-900 mt-1">{stats.totalBookings}</p>
                        </div>
                        <div className="p-3 bg-blue-100 rounded-full">
                            <span className="text-2xl">💰</span>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600">Total Amount</p>
                            <p className="text-2xl font-bold text-gray-900 mt-1">
                                ₹{stats.totalAmount.toLocaleString('en-IN')}
                            </p>
                        </div>
                        <div className="p-3 bg-green-100 rounded-full">
                            <span className="text-2xl">💵</span>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600">Pending Bookings</p>
                            <p className="text-2xl font-bold text-yellow-600 mt-1">{stats.pendingBookings}</p>
                        </div>
                        <div className="p-3 bg-yellow-100 rounded-full">
                            <span className="text-2xl">⏳</span>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600">Total Receipts</p>
                            <p className="text-2xl font-bold text-gray-900 mt-1">{stats.totalReceipts}</p>
                        </div>
                        <div className="p-3 bg-purple-100 rounded-full">
                            <span className="text-2xl">🧾</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Recent Bookings */}
            <div className="bg-white rounded-lg shadow">
                <div className="p-6 border-b border-gray-200">
                    <h2 className="text-lg font-semibold text-gray-900">Recent Booking Payments</h2>
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Booking ID</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Client</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Method</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {bookingPayments.length > 0 ? (
                                bookingPayments.slice(0, 10).map((booking) => (
                                    <tr key={booking.id}>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                            {booking.booking_id || `#${booking.id}`}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {booking.client_name || 'N/A'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            ₹{(booking.amount || 0).toLocaleString('en-IN')}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {booking.payment_method || 'N/A'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                                                booking.status === 'Cleared' ? 'bg-green-100 text-green-800' :
                                                booking.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                                                booking.status === 'Bounced' ? 'bg-red-100 text-red-800' :
                                                'bg-gray-100 text-gray-800'
                                            }`}>
                                                {booking.status || 'Pending'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {booking.payment_date ? new Date(booking.payment_date).toLocaleDateString() : 'N/A'}
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                                        No booking payments found
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

// Booking Payments Tab Component
const BookingPaymentsTab: React.FC<{
    bookingPayments: BookingPayment[];
    onRefresh: () => void;
    projects: Project[];
    towers: Tower[];
    floors: Floor[];
    units: Unit[];
    deals: Deal[];
    clients: Client[];
    selectedProject: number | null;
    selectedTower: number | null;
    selectedFloor: number | null;
    onProjectChange: (id: number | null) => void;
    onTowerChange: (id: number | null) => void;
    onFloorChange: (id: number | null) => void;
}> = ({ bookingPayments, onRefresh, projects, towers, floors, units, deals, clients, selectedProject, selectedTower, selectedFloor, onProjectChange, onTowerChange, onFloorChange }) => {
    const { showToast } = useToast();
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState<any>({
        deal: '',
        unit: '',
        client: '',
        amount: '',
        payment_method: 'UPI',
        payment_date: new Date().toISOString().split('T')[0],
        transaction_id: '',
        reference_number: '',
        cheque_number: '',
        cheque_date: '',
        cheque_bank: '',
        rtgs_neft_utr: '',
        upi_reference: '',
        notes: '',
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            // Validate required fields
            if (!formData.deal || !formData.client || !formData.amount) {
                showToast('Please fill in all required fields', 'error');
                return;
            }

            // Format payment_date properly
            const submitData: any = {
                deal: parseInt(formData.deal),
                client: parseInt(formData.client),
                amount: parseFloat(formData.amount),
                payment_method: formData.payment_method,
                payment_date: formData.payment_date ? new Date(formData.payment_date).toISOString() : new Date().toISOString(),
            };

            // Add optional fields
            if (formData.unit) submitData.unit = parseInt(formData.unit);
            if (formData.transaction_id) submitData.transaction_id = formData.transaction_id;
            if (formData.reference_number) submitData.reference_number = formData.reference_number;
            if (formData.notes) submitData.notes = formData.notes;

            // Add payment method specific fields
            if (formData.payment_method === 'Cheque') {
                if (formData.cheque_number) submitData.cheque_number = formData.cheque_number;
                if (formData.cheque_date) submitData.cheque_date = formData.cheque_date;
                if (formData.cheque_bank) submitData.cheque_bank = formData.cheque_bank;
            } else if (formData.payment_method === 'Bank Transfer') {
                if (formData.rtgs_neft_utr) submitData.rtgs_neft_utr = formData.rtgs_neft_utr;
            } else if (formData.payment_method === 'UPI') {
                if (formData.upi_reference) submitData.upi_reference = formData.upi_reference;
            }

            await createBookingPayment(submitData);
            showToast('Booking payment created successfully', 'success');
            setShowForm(false);
            // Reset form
            setFormData({
                deal: '',
                unit: '',
                client: '',
                amount: '',
                payment_method: 'UPI',
                payment_date: new Date().toISOString().split('T')[0],
                transaction_id: '',
                reference_number: '',
                cheque_number: '',
                cheque_date: '',
                cheque_bank: '',
                rtgs_neft_utr: '',
                upi_reference: '',
                notes: '',
            });
            onRefresh();
        } catch (error: any) {
            console.error('Error creating booking payment:', error);
            showToast(error?.message || 'Failed to create booking payment. Please try again.', 'error');
        }
    };

    const handleApprove = async (id: number) => {
        try {
            await approveBookingPayment(id);
            showToast('Booking payment approved', 'success');
            onRefresh();
        } catch (error: any) {
            showToast('Failed to approve booking', 'error');
        }
    };

    const handleClearCheque = async (id: number) => {
        try {
            await clearCheque(id);
            showToast('Cheque marked as cleared', 'success');
            onRefresh();
        } catch (error: any) {
            showToast('Failed to clear cheque', 'error');
        }
    };

    const handleGenerateReceipt = async (id: number) => {
        try {
            await generateReceipt(id);
            showToast('Receipt generated successfully', 'success');
            onRefresh();
        } catch (error: any) {
            showToast('Failed to generate receipt', 'error');
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold text-gray-900">Booking Payments</h2>
                <button
                    onClick={() => setShowForm(!showForm)}
                    className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                >
                    + New Booking Payment
                </button>
            </div>

            {showForm && (
                <div className="bg-white rounded-lg shadow p-6">
                    <h3 className="text-lg font-semibold mb-4">Create Booking Payment</h3>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Deal</label>
                                <select
                                    value={formData.deal}
                                    onChange={(e) => setFormData({ ...formData, deal: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                    required
                                >
                                    <option value="">Select Deal</option>
                                    {deals.map((deal) => (
                                        <option key={deal.id} value={deal.id}>
                                            Deal #{deal.id} - {deal.lead?.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Project</label>
                                <select
                                    value={selectedProject || ''}
                                    onChange={(e) => onProjectChange(e.target.value ? parseInt(e.target.value) : null)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                >
                                    <option value="">Select Project</option>
                                    {projects.map((project) => (
                                        <option key={project.id} value={project.id}>
                                            {project.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {selectedProject && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Tower</label>
                                    <select
                                        value={selectedTower || ''}
                                        onChange={(e) => onTowerChange(e.target.value ? parseInt(e.target.value) : null)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                    >
                                        <option value="">Select Tower</option>
                                        {towers.map((tower) => (
                                            <option key={tower.id} value={tower.id}>
                                                {tower.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            {selectedTower && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Floor</label>
                                    <select
                                        value={selectedFloor || ''}
                                        onChange={(e) => onFloorChange(e.target.value ? parseInt(e.target.value) : null)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                    >
                                        <option value="">Select Floor</option>
                                        {floors.map((floor) => (
                                            <option key={floor.id} value={floor.id}>
                                                Floor {floor.floor_number}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            {selectedFloor && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Unit</label>
                                    <select
                                        value={formData.unit}
                                        onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                        required
                                    >
                                        <option value="">Select Unit</option>
                                        {units.map((unit) => (
                                            <option key={unit.id} value={unit.id}>
                                                {unit.unit_number} - {unit.unit_type}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Client</label>
                                <select
                                    value={formData.client}
                                    onChange={(e) => setFormData({ ...formData, client: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                    required
                                >
                                    <option value="">Select Client</option>
                                    {clients.map((client) => (
                                        <option key={client.id} value={client.id}>
                                            {client.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={formData.amount}
                                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
                                <select
                                    value={formData.payment_method}
                                    onChange={(e) => setFormData({ ...formData, payment_method: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                    required
                                >
                                    <option value="UPI">UPI</option>
                                    <option value="Bank Transfer">RTGS/NEFT</option>
                                    <option value="Cheque">Cheque</option>
                                    <option value="Cash">Cash</option>
                                    <option value="Online">Online</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Payment Date</label>
                                <input
                                    type="date"
                                    value={formData.payment_date}
                                    onChange={(e) => setFormData({ ...formData, payment_date: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Transaction ID</label>
                                <input
                                    type="text"
                                    value={formData.transaction_id}
                                    onChange={(e) => setFormData({ ...formData, transaction_id: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Reference Number</label>
                                <input
                                    type="text"
                                    value={formData.reference_number}
                                    onChange={(e) => setFormData({ ...formData, reference_number: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                />
                            </div>
                        </div>

                        {formData.payment_method === 'Cheque' && (
                            <div className="grid grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Cheque Number</label>
                                    <input
                                        type="text"
                                        value={formData.cheque_number}
                                        onChange={(e) => setFormData({ ...formData, cheque_number: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Cheque Date</label>
                                    <input
                                        type="date"
                                        value={formData.cheque_date}
                                        onChange={(e) => setFormData({ ...formData, cheque_date: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Bank</label>
                                    <input
                                        type="text"
                                        value={formData.cheque_bank}
                                        onChange={(e) => setFormData({ ...formData, cheque_bank: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                    />
                                </div>
                            </div>
                        )}

                        {formData.payment_method === 'Bank Transfer' && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">UTR Number</label>
                                <input
                                    type="text"
                                    value={formData.rtgs_neft_utr}
                                    onChange={(e) => setFormData({ ...formData, rtgs_neft_utr: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                />
                            </div>
                        )}

                        {formData.payment_method === 'UPI' && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">UPI Reference</label>
                                <input
                                    type="text"
                                    value={formData.upi_reference}
                                    onChange={(e) => setFormData({ ...formData, upi_reference: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                />
                            </div>
                        )}

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                            <textarea
                                value={formData.notes}
                                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                rows={3}
                            />
                        </div>

                        <div className="flex justify-end space-x-3">
                            <button
                                type="button"
                                onClick={() => setShowForm(false)}
                                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
                            >
                                Create Booking Payment
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Booking Payments Table */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Booking ID</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Client</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Unit</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Method</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {bookingPayments.length > 0 ? (
                                bookingPayments.map((booking) => (
                                    <tr key={booking.id}>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                            {booking.booking_id || `#${booking.id}`}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {booking.client_name || 'N/A'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {booking.unit_address || 'N/A'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            ₹{(booking.amount || 0).toLocaleString('en-IN')}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {booking.payment_method || 'N/A'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                                                booking.status === 'Cleared' ? 'bg-green-100 text-green-800' :
                                                booking.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                                                booking.status === 'Bounced' ? 'bg-red-100 text-red-800' :
                                                'bg-gray-100 text-gray-800'
                                            }`}>
                                                {booking.status || 'Pending'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                                            {booking.status === 'Pending' && (
                                                <button
                                                    onClick={() => handleApprove(booking.id)}
                                                    className="text-blue-600 hover:text-blue-800"
                                                >
                                                    Approve
                                                </button>
                                            )}
                                            {booking.payment_method === 'Cheque' && !booking.cheque_cleared && (
                                                <button
                                                    onClick={() => handleClearCheque(booking.id)}
                                                    className="text-green-600 hover:text-green-800"
                                                >
                                                    Clear Cheque
                                                </button>
                                            )}
                                            {!booking.receipt_generated && (
                                                <button
                                                    onClick={() => handleGenerateReceipt(booking.id)}
                                                    className="text-purple-600 hover:text-purple-800"
                                                >
                                                    Generate Receipt
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                                        No booking payments found
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

// Receipts Tab Component
const ReceiptsTab: React.FC<{
    receipts: Receipt[];
    onRefresh: () => void;
}> = ({ receipts, onRefresh }) => {
    const { showToast } = useToast();
    const handleDownload = async (id: number) => {
        try {
            const data = await downloadReceipt(id);
            if (data.pdf_url) {
                window.open(data.pdf_url, '_blank');
            } else {
                showToast('Receipt PDF not available', 'warning');
            }
        } catch (error: any) {
            showToast('Failed to download receipt', 'error');
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold text-gray-900">Receipts</h2>
            </div>

            <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Receipt #</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Client</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {receipts.map((receipt) => (
                                <tr key={receipt.id}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                        {receipt.receipt_number}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {receipt.receipt_type}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {receipt.client_name}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        ₹{receipt.amount?.toLocaleString('en-IN')}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {new Date(receipt.receipt_date).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                                        <button
                                            onClick={() => handleDownload(receipt.id)}
                                            className="text-blue-600 hover:text-blue-800"
                                        >
                                            Download
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {receipts.length === 0 && (
                        <div className="text-center py-12">
                            <p className="text-gray-500">No receipts found</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

// Payment Schedules Tab Component
const PaymentSchedulesTab: React.FC<{
    schedules: PaymentSchedule[];
    deals: Deal[];
    onRefresh: () => void;
}> = ({ schedules, deals, onRefresh }) => {
    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold text-gray-900">Payment Schedules</h2>
                <button className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700">
                    + New Schedule
                </button>
            </div>

            <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Schedule Name</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Plan Type</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Amount</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Installments</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {schedules.map((schedule) => (
                                <tr key={schedule.id}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                        {schedule.name}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {schedule.plan_type}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        ₹{schedule.total_contract_value?.toLocaleString('en-IN')}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {schedule.number_of_installments}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                                            schedule.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                                        }`}>
                                            {schedule.is_active ? 'Active' : 'Inactive'}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {schedules.length === 0 && (
                        <div className="text-center py-12">
                            <p className="text-gray-500">No payment schedules found</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

// Ledger Tab Component
const LedgerTab: React.FC<{
    ledgers: Ledger[];
    onRefresh: () => void;
}> = ({ ledgers, onRefresh }) => {
    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold text-gray-900">Ledger & Statement of Account</h2>
                <button className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700">
                    Export Statement
                </button>
            </div>

            <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Debit</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Credit</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Balance</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {ledgers.map((ledger) => (
                                <tr key={ledger.id}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {new Date(ledger.transaction_date).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {ledger.transaction_type}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-500">
                                        {ledger.description}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600">
                                        {ledger.debit > 0 ? `₹${ledger.debit.toLocaleString('en-IN')}` : '-'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600">
                                        {ledger.credit > 0 ? `₹${ledger.credit.toLocaleString('en-IN')}` : '-'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                        ₹{ledger.balance?.toLocaleString('en-IN')}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {ledgers.length === 0 && (
                        <div className="text-center py-12">
                            <p className="text-gray-500">No ledger entries found</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

// Refunds Tab Component
const RefundsTab: React.FC<{
    refunds: Refund[];
    deals: Deal[];
    onRefresh: () => void;
}> = ({ refunds, deals, onRefresh }) => {
    const { showToast } = useToast();
    
    const handleApprove = async (id: number) => {
        try {
            await approveRefund(id);
            showToast('Refund approved', 'success');
            onRefresh();
        } catch (error: any) {
            showToast('Failed to approve refund', 'error');
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold text-gray-900">Refunds</h2>
                <button className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700">
                    + New Refund Request
                </button>
            </div>

            <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Refund ID</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reason</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {refunds.map((refund) => (
                                <tr key={refund.id}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                        {refund.refund_id}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        ₹{refund.amount?.toLocaleString('en-IN')}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-500">
                                        {refund.reason}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                                            refund.status === 'Processed' ? 'bg-green-100 text-green-800' :
                                            refund.status === 'Approved' ? 'bg-blue-100 text-blue-800' :
                                            refund.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                                            'bg-red-100 text-red-800'
                                        }`}>
                                            {refund.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                                        {refund.status === 'Pending' && (
                                            <button
                                                onClick={() => handleApprove(refund.id)}
                                                className="text-blue-600 hover:text-blue-800"
                                            >
                                                Approve
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {refunds.length === 0 && (
                        <div className="text-center py-12">
                            <p className="text-gray-500">No refunds found</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

// Bank Reconciliation Tab Component
const BankReconciliationTab: React.FC<{
    reconciliations: BankReconciliation[];
    onRefresh: () => void;
}> = ({ reconciliations, onRefresh }) => {
    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold text-gray-900">Bank Reconciliation</h2>
                <button className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700">
                    + Add Bank Transaction
                </button>
            </div>

            <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Bank</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reference</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {reconciliations.map((recon) => (
                                <tr key={recon.id}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {new Date(recon.transaction_date).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {recon.bank_name}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        ₹{recon.amount?.toLocaleString('en-IN')}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {recon.reference_number || recon.utr_number || 'N/A'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                                            recon.status === 'Matched' ? 'bg-green-100 text-green-800' :
                                            recon.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                                            'bg-red-100 text-red-800'
                                        }`}>
                                            {recon.status}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {reconciliations.length === 0 && (
                        <div className="text-center py-12">
                            <p className="text-gray-500">No bank reconciliations found</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

