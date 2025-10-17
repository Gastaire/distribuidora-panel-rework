/**
 * @file Contiene la vista de la bandeja de pedidos.
 *
 * Resumen del Proyecto:
 * - Frontend: React (transpilado en el navegador con Babel), TailwindCSS.
 * - Despliegue: Dockerfile que sirve archivos estáticos con Nginx.
 * - Estructura: El código se está modularizando. Este archivo es una "vista" principal.
 *   Utiliza componentes como Spinner, TableHeader, EstadoBadge, PasswordConfirmModal y varios iconos.
 *
 * La vista se carga globalmente en `index.html` y queda disponible
 * para el componente principal `App`.
 */

const PedidosView = ({ onSelectPedido, user }) => {
    const [pedidos, setPedidos] = React.useState([]);
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState(null);
    const [searchTerm, setSearchTerm] = React.useState('');
    const [showArchived, setShowArchived] = React.useState(false);
    const [confirmAction, setConfirmAction] = React.useState({ action: null, pedido: null });
    const [selectedPedidos, setSelectedPedidos] = React.useState([]);
    const token = localStorage.getItem('token');
    const { items: sortedPedidos, requestSort, sortConfig } = useSortableData(pedidos, { key: 'id', direction: 'descending' });

    const fetchPedidos = React.useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch(`${API_URL}/pedidos`, { headers: { 'Authorization': `Bearer ${token}` } });
            if (!response.ok) throw new Error('No se pudo obtener la lista de pedidos.');
            setPedidos(await response.json());
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [token]);

    React.useEffect(() => {
        fetchPedidos();
    }, [fetchPedidos]);

    const handleActionConfirm = async () => {
        const { action, pedido } = confirmAction;
        if (!action || !pedido) return;
        const url = `${API_URL}/pedidos/${pedido.id}/${action}`;
        try {
            await fetch(url, { method: 'PUT', headers: { 'Authorization': `Bearer ${token}` } });
            setConfirmAction({ action: null, pedido: null });
            fetchPedidos();
        } catch (err) {
            alert(`Error al ejecutar la acción: ${err.message}`);
            setConfirmAction({ action: null, pedido: null });
        }
    };

    const filteredPedidos = React.useMemo(() => 
        sortedPedidos.filter(p =>
            (showArchived ? p.estado === 'archivado' : p.estado !== 'archivado') &&
            ((p.nombre_comercio || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
             (p.nombre_vendedor || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
             p.id.toString().includes(searchTerm))
    ), [sortedPedidos, showArchived, searchTerm]);

    const handleSelectPedido = (pedidoId) => {
        setSelectedPedidos(prev =>
            prev.includes(pedidoId)
                ? prev.filter(id => id !== pedidoId)
                : [...prev, pedidoId]
        );
    };
    
    const handleSelectAllVisiblePedidos = () => {
        if (selectedPedidos.length === filteredPedidos.length) {
            setSelectedPedidos([]); // Deseleccionar todos los visibles
        } else {
            setSelectedPedidos(filteredPedidos.map(p => p.id)); // Seleccionar todos los visibles
        }
    };
    
    const handleCombinePedidos = async () => {
        if (selectedPedidos.length < 2) {
            alert('Selecciona al menos dos pedidos para combinar.');
            return;
        }

        const pedidosACombinar = pedidos.filter(p => selectedPedidos.includes(p.id));
        const primerClienteId = pedidosACombinar[0].cliente_id;
        if (!pedidosACombinar.every(p => p.cliente_id === primerClienteId)) {
            alert('Error: Solo puedes combinar pedidos que pertenezcan al mismo cliente.');
            return;
        }
        
        if (!window.confirm(`¿Estás seguro de que quieres combinar ${selectedPedidos.length} pedidos? Esta acción no se puede deshacer.`)) {
            return;
        }

        try {
            const response = await fetch(`${API_URL}/pedidos/combinar`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ pedidoIds: selectedPedidos }),
            });
            
            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message || 'Error desconocido al combinar los pedidos.');
            }
            
            alert(`Pedidos combinados exitosamente. Nuevo pedido maestro ID: ${result.nuevoPedidoId}`);
            
            setSelectedPedidos([]);
            fetchPedidos();
        } catch (err) {
            alert(`Error al combinar pedidos: ${err.message}`);
        }
    };

    return (
        <div>
            {confirmAction.action && (
                <PasswordConfirmModal 
                    title={`¿${confirmAction.action === 'archive' ? 'Archivar' : 'Desarchivar'} Pedido #${confirmAction.pedido.id}?`} 
                    message={confirmAction.action === 'archive' ? 'El pedido se ocultará de la lista principal.' : 'El pedido volverá a la lista de pedidos activos.'}
                    onConfirm={handleActionConfirm} 
                    onClose={() => setConfirmAction({ action: null, pedido: null })} 
                />
            )}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                <h1 className="text-3xl font-bold text-gray-800 shrink-0">Bandeja de Pedidos</h1>
                <div className="w-full flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-4">
                    {selectedPedidos.length > 1 && user.rol === 'admin' && (
                        <button 
                            onClick={handleCombinePedidos} 
                            className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-lg flex items-center justify-center"
                        >
                            <PlusIcon className="h-5 w-5 mr-2" /> Combinar ({selectedPedidos.length})
                        </button>
                    )}
                    <div className="flex items-center justify-between sm:justify-end gap-4">
                        <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-600">Archivados</span>
                            <button onClick={() => setShowArchived(!showArchived)} className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${showArchived ? 'bg-blue-600' : 'bg-gray-200'}`}>
                                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${showArchived ? 'translate-x-6' : 'translate-x-1'}`}/>
                            </button>
                        </div>
                        <input type="text" placeholder="Buscar..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full max-w-xs px-4 py-2 border border-gray-300 rounded-lg"/>
                    </div>
                </div>
            </div>
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                <div className="overflow-x-auto">
                    {loading ? <div className="p-6 flex justify-center"><Spinner className="border-blue-500"/></div> : error ? <p className="p-6 text-red-500">{error}</p> : (
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    {user.rol === 'admin' && (
                                        <th className="px-6 py-3">
                                            <input
                                                type="checkbox"
                                                className="h-4 w-4"
                                                checked={filteredPedidos.length > 0 && selectedPedidos.length === filteredPedidos.length}
                                                onChange={handleSelectAllVisiblePedidos}
                                                disabled={filteredPedidos.length === 0}
                                            />
                                        </th>
                                    )}
                                    <TableHeader sortKey="id" sortConfig={sortConfig} onSort={requestSort}>ID</TableHeader>
                                    <TableHeader sortKey="nombre_comercio" sortConfig={sortConfig} onSort={requestSort}>Cliente</TableHeader>
                                    <TableHeader sortKey="nombre_vendedor" sortConfig={sortConfig} onSort={requestSort}>Vendedor</TableHeader>
                                    <TableHeader sortKey="fecha_creacion" sortConfig={sortConfig} onSort={requestSort}>Fecha</TableHeader>
                                    <TableHeader sortKey="estado" sortConfig={sortConfig} onSort={requestSort}>Estado</TableHeader>
                                    <th className="relative px-6 py-3"></th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {filteredPedidos.map((pedido) => (
                                    <tr key={pedido.id} className={`hover:bg-gray-50 ${selectedPedidos.includes(pedido.id) ? 'bg-blue-50' : ''}`}>
                                        {user.rol === 'admin' && (
                                            <td className="px-6 py-4">
                                                <input
                                                    type="checkbox"
                                                    className="h-4 w-4"
                                                    checked={selectedPedidos.includes(pedido.id)}
                                                    onChange={() => handleSelectPedido(pedido.id)}
                                                />
                                            </td>
                                        )}
                                        <td className="px-6 py-4 text-sm font-medium text-gray-900">#{pedido.id}</td>
                                        <td className="px-6 py-4 text-sm text-gray-700">{pedido.nombre_comercio}</td>
                                        <td className="px-6 py-4 text-sm text-gray-700">{pedido.nombre_vendedor}</td>
                                        <td className="px-6 py-4 text-sm text-gray-700">{new Date(pedido.fecha_creacion).toLocaleDateString()}</td>
                                        <td className="px-6 py-4 text-sm capitalize"><EstadoBadge estado={pedido.estado} /></td>
                                        <td className="px-6 py-4 text-right text-sm font-medium space-x-4">
                                            <button onClick={() => onSelectPedido(pedido.id)} className="text-blue-600 hover:text-blue-900">Ver</button>
                                            {user.rol === 'admin' && pedido.estado !== 'archivado' && (<button onClick={() => setConfirmAction({ action: 'archive', pedido: pedido })} className="text-gray-500 hover:text-red-700">Archivar</button>)}
                                            {user.rol === 'admin' && pedido.estado === 'archivado' && (<button onClick={() => setConfirmAction({ action: 'unarchive', pedido: pedido })} className="text-green-600 hover:text-green-800">Desarchivar</button>)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                    {!loading && filteredPedidos.length === 0 && <p className="p-6 text-center text-gray-500">No se encontraron resultados.</p>}
                </div>
            </div>
        </div>
    );
};