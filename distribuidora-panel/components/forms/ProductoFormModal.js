/**
 * @file Contiene el modal con el formulario para crear o editar productos.
 *
 * Resumen del Proyecto:
 * - Frontend: React (transpilado en el navegador con Babel), TailwindCSS.
 * - Despliegue: Dockerfile que sirve archivos estáticos con Nginx.
 * - Estructura: El código se está modularizando. Este archivo es un componente de formulario.
 *   Utiliza componentes de UI como CloseIcon y CategoryCombobox. Es invocado desde `App` y `ProductosView`.
 *
 * El componente se carga globalmente en `index.html` y queda disponible
 * para el componente principal `App`.
 */

const ProductoFormModal = ({ producto, onClose, onSuccess, allCategories }) => {
    const [formData, setFormData] = React.useState({ codigo_sku: '', nombre: '', descripcion: '', precio_unitario: '', stock: 'Sí', imagen_url: '', categoria: '' });
    const [loading, setLoading] = React.useState(false);
    const [error, setError] = React.useState(null);
    const token = localStorage.getItem('token');
    const isEditing = producto && producto.id;

    React.useEffect(() => { 
        if (isEditing) { 
            setFormData({ codigo_sku: producto.codigo_sku || '', nombre: producto.nombre || '', descripcion: producto.descripcion || '', precio_unitario: producto.precio_unitario || '', stock: producto.stock || 'Sí', imagen_url: producto.imagen_url || '', categoria: producto.categoria || '' }); 
        } else {
            setFormData({ codigo_sku: '', nombre: '', descripcion: '', precio_unitario: '', stock: 'Sí', imagen_url: '', categoria: '' });
        }
    }, [producto, isEditing]);

    const handleChange = (e) => { const { name, value } = e.target; setFormData(prev => ({ ...prev, [name]: value })); };
    const handleSubmit = async (e) => {
        e.preventDefault(); setLoading(true); setError(null);
        const url = isEditing ? `${API_URL}/productos/${producto.id}` : `${API_URL}/productos`;
        const method = isEditing ? 'PUT' : 'POST';
        try {
            const body = { ...formData, categoria: formData.categoria || '' };
            const response = await fetch(url, { method, headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify(body) });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message || 'Error al guardar el producto.');
            onSuccess();
        } catch (err) { setError(err.message); } finally { setLoading(false); }
    };
     return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
            <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col">
                <div className="flex justify-between items-center p-4 border-b"><h2 className="text-xl font-bold text-gray-800">{isEditing ? 'Editar Producto' : 'Agregar Producto'}</h2><button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600"><CloseIcon/></button></div>
                <div className="p-6 overflow-y-auto space-y-4">
                    <div><label htmlFor="nombre" className="block text-sm font-medium text-gray-700">Nombre del Producto</label><input type="text" name="nombre" id="nombre" value={formData.nombre} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500" required /></div>
                    <div><label htmlFor="imagen_url" className="block text-sm font-medium text-gray-700">URL de la Imagen</label><input type="text" name="imagen_url" id="imagen_url" value={formData.imagen_url} onChange={handleChange} placeholder="https://ejemplo.com/imagen.jpg" className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3" /></div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div><label htmlFor="precio_unitario" className="block text-sm font-medium text-gray-700">Precio</label><input type="number" name="precio_unitario" id="precio_unitario" value={formData.precio_unitario} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3" required /></div>
                        <div><label htmlFor="stock" className="block text-sm font-medium text-gray-700">Stock</label><select name="stock" id="stock" value={formData.stock} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3"><option>Sí</option><option>No</option></select></div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div><label htmlFor="codigo_sku" className="block text-sm font-medium text-gray-700">SKU (Código Interno)</label><input type="text" name="codigo_sku" id="codigo_sku" value={formData.codigo_sku} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3" /></div>
                        <CategoryCombobox 
                            value={formData.categoria}
                            onChange={handleChange}
                            suggestions={allCategories}
                        />
                    </div>
                    <div><label htmlFor="descripcion" className="block text-sm font-medium text-gray-700">Descripción</label><textarea name="descripcion" id="descripcion" rows="3" value={formData.descripcion} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3"></textarea></div>
                </div>
                <div className="p-4 border-t bg-gray-50 flex justify-end items-center gap-4">{error && <p className="text-red-500 text-sm">{error}</p>}<button type="button" onClick={onClose} className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-4 rounded-lg">Cancelar</button><button type="submit" disabled={loading} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg flex items-center">{loading ? 'Guardando...' : 'Guardar Producto'}</button></div>
            </form>
        </div>
    );
};