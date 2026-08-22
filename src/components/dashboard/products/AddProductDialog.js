'use client';

import * as Dialog from '@radix-ui/react-dialog';
import * as Select from '@radix-ui/react-select';
import { X, UploadCloud, Loader2, Check, ChevronDown, CheckCircle, Plus, Trash2, Palette, Ruler, AlertCircle } from 'lucide-react';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { syncWebsiteDataClient } from '@/lib/websiteSync';
import { notifyLowStock } from '@/app/actions/productStockActions';
import { addProduct, updateProduct } from '@/app/actions/productActions';
import UpgradeModal from '@/components/dashboard/UpgradeModal';

// --- Image Upload Helper ---
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml', 'image/avif'];

async function uploadImageToCloudinary(file, folder = 'products') {
    // Client-side validation
    if (!ALLOWED_TYPES.includes(file.type)) {
        throw new Error(`Unsupported file type "${file.type}". Please upload JPEG, PNG, WebP, GIF, or SVG.`);
    }
    if (file.size > MAX_FILE_SIZE) {
        const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
        throw new Error(`Image too large (${sizeMB}MB). Maximum allowed size is 10MB.`);
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('folder', folder);

    const res = await fetch('/api/upload', { method: 'POST', body: formData });
    const data = await res.json();

    if (!data.success) {
        throw new Error(data.error || 'Image upload failed.');
    }
    return data.url;
}

export default function AddProductDialog({ isOpen, onClose, onProductAdded, categories, websiteId, productToEdit }) {
  const [loading, setLoading] = useState(false);
  const [imageUploading, setImageUploading] = useState(false);
  const [additionalUploading, setAdditionalUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [tempColorHex, setTempColorHex] = useState('#000000');
  const [tempColorName, setTempColorName] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    stock: '', 
    isUnlimited: true, // Default to Unlimited
    categoryId: '',
    description: '',
    imageUrl: '', 
    additionalImages: [], 
    variants: [], 
  });

  // Pre-defined variant types
  const VARIANT_TYPES = [
      { id: 'size', label: 'Size', icon: Ruler },
      { id: 'color', label: 'Color', icon: Palette },
      { id: 'other', label: 'Other', icon: Plus },
  ];

  useEffect(() => {
    if (isOpen) {
      setUploadError('');
      if (productToEdit) {
         setFormData({
            name: productToEdit.name || '',
            price: productToEdit.price || '',
            stock: productToEdit.stock === -1 || productToEdit.stock === 'Unlimited' ? '0' : productToEdit.stock,
            isUnlimited: productToEdit.stock === -1 || productToEdit.stock === 'Unlimited',
            categoryId: productToEdit.category_id ? String(productToEdit.category_id) : (categories?.[0]?.id ? String(categories[0].id) : ''),
            description: productToEdit.description || '',
            imageUrl: productToEdit.image_url || '',
            additionalImages: productToEdit.additional_images || [],
            variants: productToEdit.variants || [],
         });
      } else {
         setFormData({
            name: '',
            price: '',
            stock: '', // Empty if unlimited by default
            isUnlimited: true,
            categoryId: categories?.[0]?.id ? String(categories[0].id) : '',
            description: '',
            imageUrl: '',
            additionalImages: [],
            variants: [],
         });
      }
    }
  }, [isOpen, categories, productToEdit]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (name === 'stock') {
        if (value.includes('-')) return; 
        if (type !== 'checkbox') {
             // If user types in stock, disable Unlimited
             setFormData(prev => ({ ...prev, stock: value, isUnlimited: false }));
             return;
        }
    }
    if (name === 'isUnlimited' && checked) {
        // If checking unlimited, clear stock input visually
        setFormData(prev => ({ ...prev, isUnlimited: true, stock: '' }));
        return;
    }
    setFormData(prev => ({ 
        ...prev, 
        [name]: type === 'checkbox' ? checked : value 
    }));
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    setImageUploading(true);
    setUploadError('');
    try {
        const url = await uploadImageToCloudinary(file, 'products');
        setFormData(prev => ({ ...prev, imageUrl: url }));
    } catch (err) {
        setUploadError(err.message);
    } finally {
        setImageUploading(false);
        // Reset input so same file can be re-selected
        e.target.value = '';
    }
  };

  const handleAdditionalImageUpload = async (e) => {
      const files = Array.from(e.target.files);
      if (files.length + formData.additionalImages.length > 9) {
          setUploadError("You can only add up to 9 additional images.");
          e.target.value = '';
          return;
      }
      
      setAdditionalUploading(true);
      setUploadError('');
      try {
          const uploadPromises = files.map(file => uploadImageToCloudinary(file, 'products'));
          const urls = await Promise.all(uploadPromises);
          
          setFormData(prev => {
              const remaining = 9 - prev.additionalImages.length;
              const toAdd = urls.slice(0, remaining);
              return { ...prev, additionalImages: [...prev.additionalImages, ...toAdd] };
          });
      } catch (err) {
          setUploadError(err.message);
      } finally {
          setAdditionalUploading(false);
          e.target.value = '';
      }
  };

  const removeAdditionalImage = (index) => {
      setFormData(prev => ({
          ...prev,
          additionalImages: prev.additionalImages.filter((_, i) => i !== index)
      }));
  };

  const addVariant = (type) => {
      let initialValues = '';
      let initialName = '';
      
      if (type === 'size') {
          initialName = 'Size';
          initialValues = 'S, M, L, XL'; // Default suggestion
      } else if (type === 'color') {
          initialName = 'Color';
          initialValues = '#000000:Black, #FFFFFF:White'; // Default suggestion
      } else {
          initialName = 'Custom';
      }

      setFormData(prev => ({
          ...prev,
          variants: [...prev.variants, { type: type, name: initialName, values: initialValues }]
      }));
  };

  const updateVariant = (index, field, value) => {
      const newVariants = [...formData.variants];
      newVariants[index][field] = value;
      setFormData(prev => ({ ...prev, variants: newVariants }));
  };

  const removeVariant = (index) => {
      setFormData(prev => ({
          ...prev,
          variants: prev.variants.filter((_, i) => i !== index)
      }));
  };

  const addColorToVariant = (idx) => {
      if (!tempColorName.trim()) {
          alert('Please enter a color name (e.g. Black)');
          return;
      }
      const newColorString = `${tempColorHex}:${tempColorName.trim()}`;
      const currentValues = formData.variants[idx].values;
      const newValues = currentValues ? `${currentValues}, ${newColorString}` : newColorString;
      updateVariant(idx, 'values', newValues);
      setTempColorName('');
  };


  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    if (!websiteId) {
        alert("System Error: No Website ID found. Please reload.");
        setLoading(false);
        return;
    }

    try {
      let finalStock = parseInt(formData.stock);
      
      // If unlimited is checked OR stock input is empty/NaN, treat as -1 (Unlimited)
      if (formData.isUnlimited || isNaN(finalStock)) {
          finalStock = -1;
      }
      // Ensure positive if finite
      if (finalStock < 0 && finalStock !== -1) finalStock = 0;

      const cleanVariants = formData.variants.filter(v => v.name.trim() !== '' && v.values.trim() !== '');

      let productId = productToEdit ? productToEdit.id : null;

      if (productToEdit) {
          // Use Server Action for Update (admin client, bypasses RLS)
          const updatePayload = {
            name: formData.name,
            price: parseFloat(formData.price),
            categoryId: (!formData.categoryId || formData.categoryId === 'uncategorized') ? 'uncategorized' : String(formData.categoryId),
            description: formData.description,
            imageUrl: formData.imageUrl,
            stock: finalStock,
            additionalImages: formData.additionalImages,
            variants: cleanVariants
          };

          const result = await updateProduct(productToEdit.id, updatePayload);
          if (!result.success) throw new Error(result.error);

          if (finalStock !== -1 && finalStock <= 5) {
              await notifyLowStock(productToEdit.id);
          }

      } else {
          // Use Server Action for Add
          const serverPayload = {
            name: formData.name,
            price: parseFloat(formData.price),
            categoryId: (!formData.categoryId || formData.categoryId === 'uncategorized') ? 'uncategorized' : String(formData.categoryId),
            description: formData.description,
            imageUrl: formData.imageUrl,
            stock: finalStock,
            isUnlimited: formData.isUnlimited,
            additionalImages: formData.additionalImages,
            variants: cleanVariants
          };

          const result = await addProduct(serverPayload);

          if (!result.success) {
              if (result.error && result.error.includes("Plan limit reached")) {
                  setShowUpgradeModal(true);
                  setLoading(false);
                  return; // Stop here, keep dialog open (UpgradeModal will show over it)
              }
              throw new Error(result.error);
          }
      }

      onProductAdded();
      onClose();

    } catch (err) {
      console.error(err);
      alert('Failed to save product: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <UpgradeModal isOpen={showUpgradeModal} onClose={() => setShowUpgradeModal(false)} />
      
      <Dialog.Root open={isOpen} onOpenChange={onClose}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60] transition-opacity" />
          <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[95vw] md:w-full max-w-lg h-[80vh] md:h-[600px] bg-white rounded-2xl shadow-2xl z-[70] flex flex-col focus:outline-none overflow-hidden font-sans">
            
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-white shrink-0 z-10">
              <Dialog.Title className="text-xl font-bold text-gray-900">
                {productToEdit ? 'Edit Product' : 'Add New Product'}
              </Dialog.Title>
              <Dialog.Close asChild>
                <button className="p-2 hover:bg-gray-100 rounded-full text-gray-500 transition-colors">
                  <X size={20} />
                </button>
              </Dialog.Close>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col flex-1 h-full overflow-hidden">
              <div className="flex-1 overflow-y-auto p-6 md:p-8 custom-scrollbar relative">
                  <div className="space-y-6">

                      {/* Upload Error Banner */}
                      {uploadError && (
                          <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-xl animate-in fade-in duration-200">
                              <AlertCircle size={16} className="text-red-500 mt-0.5 shrink-0" />
                              <div className="flex-1">
                                  <p className="text-sm text-red-700 font-medium">{uploadError}</p>
                              </div>
                              <button type="button" onClick={() => setUploadError('')} className="text-red-400 hover:text-red-600">
                                  <X size={14} />
                              </button>
                          </div>
                      )}
                      
                      {/* Main Image */}
                      <div className="flex justify-center">
                          <div className="relative group w-32 h-32 rounded-2xl bg-gray-50/50 border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden hover:border-[#8A63D2] hover:bg-brand-50 transition-all cursor-pointer">
                              {imageUploading ? (
                              <div className="flex flex-col items-center text-[#8A63D2]">
                                  <Loader2 size={24} className="animate-spin" />
                                  <span className="text-xs mt-1">Uploading...</span>
                              </div>
                              ) : formData.imageUrl ? (
                              <img src={formData.imageUrl} alt="Preview" className="w-full h-full object-cover" />
                              ) : (
                              <div className="flex flex-col items-center text-gray-400">
                                  <UploadCloud size={24} />
                                  <span className="text-xs mt-1">Main Image</span>
                              </div>
                              )}
                              <input 
                              type="file" 
                              accept="image/*" 
                              className="absolute inset-0 opacity-0 cursor-pointer" 
                              onChange={handleImageUpload}
                              disabled={imageUploading}
                              />
                          </div>
                      </div>

                      {/* Additional Images */}
                      <div className="space-y-2">
                          <label className="text-xs font-bold text-gray-500 uppercase">Additional Images (Max 9)</label>
                          <div className="grid grid-cols-5 gap-2">
                              {formData.additionalImages.map((img, idx) => (
                                  <div key={idx} className="relative aspect-square rounded-lg overflow-hidden border border-gray-200 group">
                                      <img src={img} alt="" className="w-full h-full object-cover" />
                                      <button 
                                          type="button" 
                                          onClick={() => removeAdditionalImage(idx)}
                                          className="absolute top-0.5 right-0.5 bg-black/50 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                                      >
                                          <X size={12} />
                                      </button>
                                  </div>
                              ))}
                              {formData.additionalImages.length < 9 && (
                                  <div className="relative aspect-square rounded-lg bg-gray-50 border border-dashed border-gray-300 flex items-center justify-center hover:bg-brand-50 hover:border-brand-300 transition-colors cursor-pointer">
                                      {additionalUploading ? (
                                          <Loader2 size={16} className="text-[#8A63D2] animate-spin" />
                                      ) : (
                                          <Plus size={16} className="text-gray-400" />
                                      )}
                                      <input 
                                          type="file" 
                                          accept="image/*" 
                                          multiple
                                          className="absolute inset-0 opacity-0 cursor-pointer" 
                                          onChange={handleAdditionalImageUpload}
                                          disabled={additionalUploading}
                                      />
                                  </div>
                              )}
                          </div>
                      </div>

                      <div className="space-y-1.5">
                          <label className="text-xs font-bold text-gray-500 uppercase">Product Name</label>
                          <input 
                          name="name"
                          value={formData.name}
                          onChange={handleChange}
                          required
                          placeholder="e.g. Leather Pouch"
                          className="w-full p-3 border border-gray-300 rounded-md text-sm outline-none focus:ring-1 focus:ring-brand-500 transition-all"
                          />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-1.5">
                              <label className="text-xs font-bold text-gray-500 uppercase">Price</label>
                              <input 
                              name="price"
                              type="number"
                              step="0.01"
                              value={formData.price}
                              onChange={handleChange}
                              required
                              placeholder="0.00"
                              className="w-full p-3 border border-gray-300 rounded-md text-sm outline-none focus:ring-1 focus:ring-brand-500 transition-all"
                              />
                          </div>
                          
                          <div className="space-y-1.5">
                              <div className="flex items-center justify-between">
                                <label className="text-xs font-bold text-gray-500 uppercase">Stock</label>
                                <label className="flex items-center gap-1 cursor-pointer">
                                    <input 
                                    type="checkbox" 
                                    name="isUnlimited"
                                    checked={formData.isUnlimited}
                                    onChange={handleChange}
                                    className="w-3 h-3 text-[#8A63D2] rounded focus:ring-[#8A63D2]"
                                    />
                                    <span className="text-[10px] text-gray-500 font-medium">Unlimited</span>
                                </label>
                            </div>
                            {formData.isUnlimited ? (
                                <div className="w-full p-3 border border-gray-200 bg-gray-50 rounded-md text-gray-400 text-sm italic">
                                    Stock is unlimited
                                </div>
                            ) : (
                                <input 
                                name="stock"
                                type="number"
                                min="0"
                                value={formData.stock}
                                onChange={handleChange}
                                placeholder="Qty"
                                className="w-full p-3 border border-gray-300 rounded-md text-sm outline-none focus:ring-1 focus:ring-brand-500 transition-all"
                                />
                            )}
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-gray-500 uppercase">Category</label>
                        <Select.Root 
                            value={String(formData.categoryId)} 
                            onValueChange={(val) => setFormData(prev => ({ ...prev, categoryId: val }))}
                        >
                            <Select.Trigger className="w-full p-3 border border-gray-300 rounded-md text-sm outline-none focus:ring-1 focus:ring-brand-500 transition-all bg-white flex justify-between items-center text-left">
                                <Select.Value placeholder="Select Category">
                                    {categories.find(c => String(c.id) === String(formData.categoryId))?.name || 'Select Category'}
                                </Select.Value>
                                <Select.Icon>
                                    <ChevronDown className="h-4 w-4 text-gray-400" />
                                </Select.Icon>
                            </Select.Trigger>
                            <Select.Portal>
                                <Select.Content className="overflow-hidden bg-white rounded-xl shadow-xl border border-gray-100 z-[80]">
                                    <Select.Viewport className="p-1">
                                        {categories.map((c) => (
                                            <Select.Item 
                                                key={c.id} 
                                                value={String(c.id)} 
                                                className="relative flex items-center px-8 py-2 text-sm text-gray-700 rounded-md select-none hover:bg-brand-50 hover:text-brand-700 cursor-pointer outline-none data-[highlighted]:bg-brand-50 data-[highlighted]:text-brand-700"
                                            >
                                                <Select.ItemText>{c.name}</Select.ItemText>
                                                <Select.ItemIndicator className="absolute left-2 inline-flex items-center">
                                                    <CheckCircle size={14} className="text-brand-600"/>
                                                </Select.ItemIndicator>
                                            </Select.Item>
                                        ))}
                                    </Select.Viewport>
                                </Select.Content>
                            </Select.Portal>
                        </Select.Root>
                    </div>

                    {/* Variants */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <label className="text-xs font-bold text-gray-500 uppercase">Variants</label>
                            
                            {/* Variant Type Selector */}
                            <div className="flex gap-2">
                                {VARIANT_TYPES.map(type => (
                                    <button 
                                        key={type.id}
                                        type="button" 
                                        onClick={() => addVariant(type.id)}
                                        className="text-xs bg-gray-100 px-2 py-1 rounded hover:bg-brand-50 hover:text-[#8A63D2] font-medium flex items-center gap-1 transition-colors"
                                    >
                                        <type.icon size={12} /> {type.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {formData.variants.length === 0 && (
                            <div className="text-center p-4 bg-gray-50 rounded-lg border border-dashed border-gray-200 text-gray-400 text-sm">
                                No variants added. Click buttons above to add Size, Color, etc.
                            </div>
                        )}

                        {formData.variants.map((variant, idx) => (
                            <div key={idx} className="p-3 bg-gray-50 rounded-lg border border-gray-200 space-y-2">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        {variant.type === 'size' && <Ruler size={14} className="text-gray-500"/>}
                                        {variant.type === 'color' && <Palette size={14} className="text-gray-500"/>}
                                        {variant.type === 'other' && <Plus size={14} className="text-gray-500"/>}
                                        <span className="text-sm font-bold text-gray-700">{variant.name}</span>
                                    </div>
                                    <button 
                                        type="button" 
                                        onClick={() => removeVariant(idx)}
                                        className="text-gray-400 hover:text-red-500 transition-colors"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>

                                    <div className="flex gap-2">
                                        <div className="w-1/3">
                                            <input 
                                                placeholder="Name" 
                                                className="w-full p-2 border border-gray-300 rounded-md text-xs outline-none focus:ring-1 focus:ring-brand-500"
                                                value={variant.name}
                                                onChange={(e) => updateVariant(idx, 'name', e.target.value)}
                                            />
                                        </div>
                                        <div className="flex-1">
                                            <input 
                                                placeholder={variant.type === 'color' ? "#HEX:Name, #HEX:Name" : "Values (comma separated)"} 
                                                className="w-full p-2 border border-gray-300 rounded-md text-xs outline-none focus:ring-1 focus:ring-brand-500"
                                                value={variant.values}
                                                onChange={(e) => updateVariant(idx, 'values', e.target.value)}
                                            />
                                            {variant.type === 'color' && (
                                                <div className="mt-3 p-3 bg-white border border-gray-200 rounded-md shadow-sm">
                                                    <p className="text-[10px] text-gray-500 font-semibold mb-2 uppercase tracking-wide">Add a Color (Optional UI)</p>
                                                    <div className="flex items-center gap-2">
                                                        <input 
                                                            type="color" 
                                                            value={tempColorHex}
                                                            onChange={(e) => setTempColorHex(e.target.value)}
                                                            className="w-8 h-8 rounded cursor-pointer border-0 p-0"
                                                            title="Pick a color"
                                                        />
                                                        <input 
                                                            type="text"
                                                            placeholder="Color Name (e.g. Midnight Blue)"
                                                            value={tempColorName}
                                                            onChange={(e) => setTempColorName(e.target.value)}
                                                            className="flex-1 p-1.5 border border-gray-300 rounded-md text-xs outline-none focus:ring-1 focus:ring-brand-500"
                                                        />
                                                        <button 
                                                            type="button"
                                                            onClick={() => addColorToVariant(idx)}
                                                            className="px-3 py-1.5 bg-brand-500 text-white text-xs font-semibold rounded-md hover:bg-brand-600 transition-colors"
                                                        >
                                                            Add
                                                        </button>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-gray-500 uppercase">Description</label>
                        <textarea 
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                            rows={3}
                            placeholder="Product details..."
                            className="w-full p-3 border border-gray-300 rounded-md text-sm outline-none focus:ring-1 focus:ring-brand-500 resize-none transition-all"
                        />
                    </div>
                </div>
            </div>

            <div className="p-6 border-t border-gray-100 flex justify-end gap-3 bg-white shrink-0 z-10">
              <button 
                type="button" 
                onClick={onClose}
                className="px-6 py-2.5 rounded-xl border border-gray-200 text-gray-600 font-medium hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button 
                type="submit" 
                disabled={loading || imageUploading || additionalUploading}
                className="px-8 py-2.5 rounded-xl bg-[#8A63D2] text-white font-bold hover:bg-[#7854bc] transition-colors disabled:opacity-50 flex items-center gap-2 shadow-lg shadow-brand-200"
              >
                {loading ? <Loader2 size={18} className="animate-spin" /> : <Check size={18} />}
                {productToEdit ? 'Save Changes' : 'Add Product'}
              </button>
            </div>

          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
    </>
  );
}
