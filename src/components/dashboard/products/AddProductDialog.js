'use client';

import * as Dialog from '@radix-ui/react-dialog';
import * as Select from '@radix-ui/react-select';
import { X, UploadCloud, ImagePlus, Loader2, Check, ChevronDown, CheckCircle, Plus, Trash2, Palette, Ruler, AlertCircle } from 'lucide-react';
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
  const [errors, setErrors] = useState({});
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [customVariantNames, setCustomVariantNames] = useState([]);
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


  const initVariants = (variants) => {
      return (variants || []).map(v => {
          if (v.options && Array.isArray(v.options)) return v;
          const opts = (v.values || '').split(',').map(s => s.trim()).filter(Boolean).map(val => {
              return { name: val, price: '', stock: '', isDefault: false };
          });
          return { ...v, options: opts };
      });
  };

  useEffect(() => {
    if (isOpen) {
      if (websiteId) {
          supabase.from('websites').select('website_data').eq('id', websiteId).single()
          .then(({data}) => {
              if (data?.website_data?.customVariantNames) {
                  setCustomVariantNames(data.website_data.customVariantNames);
              }
          });
      }
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
            variants: initVariants(productToEdit.variants),
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
  }, [isOpen, categories, productToEdit, websiteId]);

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
      setFormData(prev => {
          const defaultPrice = prev.price !== '' ? prev.price : '';
          const defaultStock = prev.isUnlimited ? '' : (prev.stock !== '' ? prev.stock : '');
          const defaultIsUnlimited = prev.isUnlimited || false;

          let initialName = '';
          let initialOptions = [];
          
          if (type === 'size') {
              initialName = 'Size';
              initialOptions = ['S', 'M', 'L', 'XL'].map(size => ({
                 name: size, price: defaultPrice, stock: defaultStock, isUnlimited: defaultIsUnlimited, isDefault: false 
              }));
          } else if (type === 'color') {
              initialName = 'Color';
              initialOptions = [
                 { name: '#000000:Black', price: defaultPrice, stock: defaultStock, isUnlimited: defaultIsUnlimited, isDefault: false },
                 { name: '#FFFFFF:White', price: defaultPrice, stock: defaultStock, isUnlimited: defaultIsUnlimited, isDefault: false }
              ];
          } else {
              initialName = '';
              initialOptions = [ { name: '', price: defaultPrice, stock: defaultStock, isUnlimited: defaultIsUnlimited, isDefault: false } ];
          }

          return {
              ...prev,
              variants: [...prev.variants, { type: type, name: initialName, values: '', options: initialOptions }]
          };
      });
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

  const addSubVariant = (variantIndex) => {
      const newVariants = [...formData.variants];
      newVariants[variantIndex].options.push({ 
          name: '', 
          price: formData.price !== '' ? formData.price : '', 
          stock: formData.isUnlimited ? '' : (formData.stock !== '' ? formData.stock : ''), 
          isUnlimited: formData.isUnlimited || false,
          isDefault: false 
      });
      setFormData(prev => ({ ...prev, variants: newVariants }));
      
      // Clear any hanging errors for the newly added option index
      const newOptIdx = newVariants[variantIndex].options.length - 1;
      setErrors(prev => ({ 
          ...prev, 
          [`variant-${variantIndex}-${newOptIdx}-price`]: '',
          [`variant-${variantIndex}-${newOptIdx}-stock`]: ''
      }));
  };

  const updateSubVariant = (variantIndex, optIndex, field, value) => {
      setErrors(prev => ({ ...prev, [`variant-${variantIndex}-${optIndex}-${field}`]: "" }));
      if (field === 'price') {
          if (Number(value) < 0) {
              setErrors(prev => ({ ...prev, [`variant-${variantIndex}-${optIndex}-price`]: "Price cannot be negative" }));
              return;
          }
      }
      
      if (field === 'stock') {
          if (Number(value) < 0) {
              setErrors(prev => ({ ...prev, [`variant-${variantIndex}-${optIndex}-stock`]: "Stock cannot be negative" }));
              return;
          }
      }
      
      const newVariants = [...formData.variants];
      if (field === 'isDefault' && value === true) {
          newVariants[variantIndex].options.forEach(opt => opt.isDefault = false);
      }
      newVariants[variantIndex].options[optIndex][field] = value;
      setFormData(prev => ({ ...prev, variants: newVariants }));
  };

  const removeSubVariant = (variantIndex, optIndex) => {
      const newVariants = [...formData.variants];
      newVariants[variantIndex].options.splice(optIndex, 1);
      setFormData(prev => ({ ...prev, variants: newVariants }));
      
      // When removing an option, the indices shift down. 
      // Safest way is to clear all variant errors to prevent stale errors on shifted fields
      setErrors(prev => {
          const newErr = { ...prev };
          Object.keys(newErr).forEach(key => {
              if (key.startsWith(`variant-${variantIndex}-`)) delete newErr[key];
          });
          return newErr;
      });
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

            const cleanVariants = formData.variants.map(v => {
          const cleanOpts = (v.options || []).filter(o => o.name.trim() !== '');
          const valsString = cleanOpts.map(o => o.name.trim()).join(', ');
          return { ...v, options: cleanOpts, values: valsString };
      }).filter(v => v.name.trim() !== '' && v.options.length > 0);

      // Background process: Save custom variant names
      const currentCustomNames = cleanVariants.filter(v => v.type === 'other').map(v => v.name.trim());
      const newCustomNames = currentCustomNames.filter(name => name && !customVariantNames.includes(name));
      if (newCustomNames.length > 0 && websiteId) {
           const updatedCustomNames = [...new Set([...customVariantNames, ...newCustomNames])];
           supabase.from('websites').select('website_data').eq('id', websiteId).single().then(({data}) => {
               if (data && data.website_data) {
                   const newWebData = { ...data.website_data, customVariantNames: updatedCustomNames };
                   supabase.from('websites').update({ website_data: newWebData }).eq('id', websiteId).then();
               }
           });
      }

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
                          <div className="relative group w-full h-48 rounded-2xl bg-gray-50/50 border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden hover:border-[#8A63D2] hover:bg-brand-50 transition-all cursor-pointer">
                              {imageUploading ? (
                              <div className="flex flex-col items-center text-[#8A63D2]">
                                  <Loader2 size={32} className="animate-spin" />
                                  <span className="text-sm mt-2">Uploading...</span>
                              </div>
                              ) : formData.imageUrl ? (
                              <img src={formData.imageUrl} alt="Preview" className="w-full h-full object-cover" />
                              ) : (
                              <div className="flex flex-col items-center text-gray-400 group-hover:text-[#8A63D2] transition-colors">
                                  <ImagePlus size={32} />
                                  <span className="text-sm mt-2 font-medium">Click to upload Main Image</span>
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
                          className="w-full p-3 border border-gray-300 rounded-md text-sm outline-none focus:ring-1 focus:border-[#8A63D2] focus:ring-1 focus:ring-[#8A63D2] transition-all"
                          />
                          {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-1.5">
                              <label className="text-xs font-bold text-gray-500 uppercase">Price</label>
                              <input 
                              name="price"
                              type="number"
                              step="0.01"
                              min="0"
                              value={formData.price}
                              onChange={handleChange}
                              required
                              onWheel={(e) => e.target.blur()}
                              placeholder="0.00"
                              className="w-full p-3 border border-gray-300 rounded-md text-sm outline-none focus:ring-1 focus:border-[#8A63D2] focus:ring-1 focus:ring-[#8A63D2] transition-all appearance-none [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-inner-spin-button]:m-0 [&::-webkit-outer-spin-button]:m-0"
                              />
                              {errors.price && <p className="text-red-500 text-xs mt-1">{errors.price}</p>}
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
                                    className="w-3 h-3 text-[#8A63D2] accent-[#8A63D2] rounded focus:ring-[#8A63D2]"
                                    />
                                    <span className="text-[10px] text-gray-500 font-medium">Unlimited</span>
                                </label>
                            </div>
                            {formData.isUnlimited ? (
                                <input 
                                    disabled
                                    type="text"
                                    value="Unlimited"
                                    className="w-full p-3 border border-gray-200 bg-gray-50 rounded-md text-gray-500 font-medium text-sm cursor-not-allowed select-none"
                                />
                            ) : (
                                <div className="w-full">
                                    <input 
                                    name="stock"
                                    type="number"
                                    min="0"
                                    value={formData.stock}
                                    onChange={handleChange}
                                    onWheel={(e) => e.target.blur()}
                                    placeholder="Qty"
                                    onKeyDown={(e) => {
                                        if (['e', 'E', '+'].includes(e.key)) {
                                            e.preventDefault();
                                        } else if (e.key === '-') {
                                            e.preventDefault();
                                            setErrors(prev => ({ ...prev, stock: "Stock cannot be negative" }));
                                        } else if (e.key === '.') {
                                            e.preventDefault();
                                            setErrors(prev => ({ ...prev, stock: "Decimals not allowed" }));
                                        }
                                    }}
                                    className="w-full p-3 border border-gray-300 rounded-md text-sm outline-none focus:ring-1 focus:border-[#8A63D2] focus:ring-1 focus:ring-[#8A63D2] transition-all appearance-none [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-inner-spin-button]:m-0 [&::-webkit-outer-spin-button]:m-0"
                                    />
                                    {errors.stock && <p className="text-red-500 text-xs mt-1">{errors.stock}</p>}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-gray-500 uppercase">Category</label>
                        <Select.Root 
                            value={String(formData.categoryId)} 
                            onValueChange={(val) => setFormData(prev => ({ ...prev, categoryId: val }))}
                        >
                            <Select.Trigger className="w-full p-3 border border-gray-300 rounded-md text-sm outline-none focus:ring-1 focus:border-[#8A63D2] focus:ring-1 focus:ring-[#8A63D2] transition-all bg-white flex justify-between items-center text-left">
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

                                <div className="space-y-3">
                                    <div className="w-1/2">
                                        {variant.type === 'other' && customVariantNames.length > 0 ? (
                                            <>
                                                <input 
                                                    placeholder="Custom Name (e.g. Material)" 
                                                    list={`custom-variants-${idx}`}
                                                    className="w-full p-2 border border-gray-300 rounded-md text-xs outline-none focus:ring-1 focus:border-[#8A63D2] focus:ring-1 focus:ring-[#8A63D2]"
                                                    value={variant.name}
                                                    onChange={(e) => updateVariant(idx, 'name', e.target.value)}
                                                />
                                                <datalist id={`custom-variants-${idx}`}>
                                                    {customVariantNames.map((name, i) => <option key={i} value={name} />)}
                                                </datalist>
                                            </>
                                        ) : (
                                            <input 
                                                placeholder={variant.type === 'other' ? "Custom Name" : "Name"}
                                                className="w-full p-2 border border-gray-300 rounded-md text-xs outline-none focus:ring-1 focus:border-[#8A63D2] focus:ring-1 focus:ring-[#8A63D2]"
                                                value={variant.name}
                                                onChange={(e) => updateVariant(idx, 'name', e.target.value)}
                                                disabled={variant.type !== 'other'}
                                            />
                                        )}
                                    </div>
                                    
                                    <div className="space-y-3 bg-white p-3 rounded-lg border border-gray-200 shadow-sm mt-3">
                                        {(variant.options || []).map((opt, optIdx) => {
                                            const isColor = variant.type === 'color';
                                            let colorHex = '#000000';
                                            let colorName = opt.name;
                                            if (isColor && opt.name) {
                                                const parts = opt.name.split(':');
                                                if (parts.length > 1 && parts[0].startsWith('#')) {
                                                    colorHex = parts[0];
                                                    colorName = parts.slice(1).join(':');
                                                }
                                            }
                                            return (
                                            <div key={optIdx} className="relative flex flex-wrap md:flex-nowrap gap-3 items-end pb-4 border-b border-gray-100 last:border-0 last:pb-0 pt-8 mt-2">
                                                {/* Top Right Actions */}
                                                <div className="absolute top-0 right-0 flex items-center gap-4">
                                                    <label className="text-[10px] font-bold text-gray-500 uppercase flex items-center gap-1.5 cursor-pointer hover:text-gray-700">
                                                        <div 
                                                            className={`w-4 h-4 flex items-center justify-center rounded cursor-pointer border transition-colors ${opt.isDefault ? 'bg-[#8A63D2] border-[#8A63D2]' : 'border-gray-300 bg-white'}`}
                                                            onClick={(e) => updateSubVariant(idx, optIdx, 'isDefault', !opt.isDefault)}
                                                        >
                                                            {opt.isDefault && <Check size={12} className="text-white" />}
                                                        </div>
                                                        <span>Default</span>
                                                    </label>
                                                    <button 
                                                        type="button" 
                                                        onClick={() => removeSubVariant(idx, optIdx)}
                                                        className="text-gray-400 hover:text-red-500 transition-colors p-1 rounded-md hover:bg-red-50"
                                                        title="Remove Option"
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                </div>

                                                <div className={`${isColor ? 'w-[130px]' : 'w-[80px]'} shrink-0`}>
                                                    <label className="text-[10px] font-bold text-gray-500 uppercase mb-1 block">
                                                        {isColor ? 'Color & Name' : 'Option Name'}
                                                    </label>
                                                    {isColor ? (
                                                        <div className="flex gap-2 items-center">
                                                            <div 
                                                                className="w-10 h-10 shrink-0 rounded-md overflow-hidden shadow-sm border border-gray-300 relative" 
                                                                style={{ backgroundColor: colorHex }}
                                                            >
                                                                <input 
                                                                    type="color"
                                                                    value={colorHex}
                                                                    onChange={(e) => {
                                                                        updateSubVariant(idx, optIdx, 'name', `${e.target.value}:${colorName}`);
                                                                    }}
                                                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                                                />
                                                            </div>
                                                            <input 
                                                                placeholder="e.g. Red" 
                                                                className="flex-1 min-w-0 p-2 border border-gray-300 rounded-md text-xs outline-none focus:border-[#8A63D2] focus:ring-1 focus:ring-[#8A63D2] transition-colors"
                                                                value={colorName}
                                                                onChange={(e) => {
                                                                    updateSubVariant(idx, optIdx, 'name', `${colorHex}:${e.target.value}`);
                                                                }}
                                                            />
                                                        </div>
                                                    ) : (
                                                        <input 
                                                            placeholder="e.g. Small, Red" 
                                                            className="w-full p-2 border border-gray-300 rounded-md text-xs outline-none focus:border-[#8A63D2] focus:ring-1 focus:ring-[#8A63D2] transition-colors"
                                                            value={opt.name}
                                                            onChange={(e) => updateSubVariant(idx, optIdx, 'name', e.target.value)}
                                                        />
                                                    )}
                                                </div>
                                                <div className="w-[110px]">
                                                    <label className="text-[10px] font-bold text-gray-500 uppercase mb-1 block" title="Leave blank to use base price">Price (₹)</label>
                                                    <input 
                                                        placeholder="Base Price" 
                                                        type="number"
                                                        min="0"
                                                        step="0.01"
                                                        onWheel={(e) => e.target.blur()}
                                                        onKeyDown={(e) => {
                                                            if (['e', 'E', '+'].includes(e.key)) {
                                                                e.preventDefault();
                                                            } else if (e.key === '-') {
                                                                e.preventDefault();
                                                                setErrors(prev => ({ ...prev, [`variant-${idx}-${optIdx}-price`]: "Price cannot be negative" }));
                                                            }
                                                        }}
                                                        className="w-full p-2 border border-gray-300 rounded-md text-xs outline-none focus:border-[#8A63D2] focus:ring-1 focus:ring-[#8A63D2] transition-colors appearance-none [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-inner-spin-button]:m-0 [&::-webkit-outer-spin-button]:m-0"
                                                        value={opt.price}
                                                        onChange={(e) => updateSubVariant(idx, optIdx, 'price', e.target.value)}
                                                        onFocus={() => {
                                                            if (String(opt.price) === String(formData.price) && formData.price !== '') {
                                                                updateSubVariant(idx, optIdx, 'price', '');
                                                            }
                                                        }}
                                                        onBlur={(e) => {
                                                            if (e.target.value === '' && formData.price !== '') {
                                                                updateSubVariant(idx, optIdx, 'price', formData.price);
                                                            }
                                                        }}
                                                    />
                                                    {errors[`variant-${idx}-${optIdx}-price`] && <p className="text-red-500 text-[10px] mt-1 leading-tight">{errors[`variant-${idx}-${optIdx}-price`]}</p>}
                                                </div>
                                                <div className="flex-[1.2]">
                                                    <div className="flex items-center justify-between mb-1">
                                                        <label className="text-[10px] font-bold text-gray-500 uppercase" title="Leave blank to use base stock">Stock</label>
                                                        <div className="flex items-center gap-1">
                                                            <div 
                                                                className={`w-3.5 h-3.5 flex items-center justify-center rounded cursor-pointer border transition-colors ${opt.isUnlimited ? 'bg-[#8A63D2] border-[#8A63D2]' : 'border-gray-300 bg-white'}`}
                                                                onClick={(e) => {
                                                                    updateSubVariant(idx, optIdx, 'isUnlimited', !opt.isUnlimited);
                                                                    if (!opt.isUnlimited) updateSubVariant(idx, optIdx, 'stock', '');
                                                                }}
                                                                title="Unlimited Stock"
                                                            >
                                                                {opt.isUnlimited && <Check size={10} className="text-white" />}
                                                            </div>
                                                            <span className="text-[9px] font-bold text-gray-500 uppercase cursor-pointer" onClick={() => { updateSubVariant(idx, optIdx, 'isUnlimited', !opt.isUnlimited); if (!opt.isUnlimited) updateSubVariant(idx, optIdx, 'stock', ''); }}>Unlimited</span>
                                                        </div>
                                                    </div>
                                                    {opt.isUnlimited ? (
                                                        <input 
                                                            disabled
                                                            type="text"
                                                            value="Unlimited"
                                                            className="w-full p-2 border border-gray-200 bg-gray-50 rounded-md text-gray-500 font-medium text-xs h-[34px] cursor-not-allowed select-none"
                                                        />
                                                    ) : (
                                                    <div className="w-full">
                                                    <input 
                                                        placeholder="Base Stock" 
                                                        type="number"
                                                        min="0"
                                                        onWheel={(e) => e.target.blur()}
                                                        onKeyDown={(e) => {
                                                            if (['e', 'E', '+'].includes(e.key)) {
                                                                e.preventDefault();
                                                            } else if (e.key === '-') {
                                                                e.preventDefault();
                                                                setErrors(prev => ({ ...prev, [`variant-${idx}-${optIdx}-stock`]: "Stock cannot be negative" }));
                                                            } else if (e.key === '.') {
                                                                e.preventDefault();
                                                                setErrors(prev => ({ ...prev, [`variant-${idx}-${optIdx}-stock`]: "Decimals not allowed" }));
                                                            }
                                                        }}
                                                        className="w-full p-2 border border-gray-300 rounded-md text-xs outline-none focus:border-[#8A63D2] focus:ring-1 focus:ring-[#8A63D2] transition-colors appearance-none [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-inner-spin-button]:m-0 [&::-webkit-outer-spin-button]:m-0"
                                                        value={opt.stock}
                                                        onChange={(e) => updateSubVariant(idx, optIdx, 'stock', e.target.value)}
                                                        onFocus={() => {
                                                            if (!opt.isUnlimited && String(opt.stock) === String(formData.stock) && formData.stock !== '') {
                                                                updateSubVariant(idx, optIdx, 'stock', '');
                                                            }
                                                        }}
                                                        onBlur={(e) => {
                                                            if (!opt.isUnlimited && e.target.value === '' && formData.stock !== '') {
                                                                updateSubVariant(idx, optIdx, 'stock', formData.stock);
                                                            }
                                                        }}
                                                    />
                                                    {errors[`variant-${idx}-${optIdx}-stock`] && <p className="text-red-500 text-[10px] mt-1 leading-tight">{errors[`variant-${idx}-${optIdx}-stock`]}</p>}
                                                    </div>
                                                    )}
                                                </div>
                                            </div>
                                            );
                                        })}
                                        
                                        <div className="pt-2">
                                            <button 
                                                type="button" 
                                                onClick={() => addSubVariant(idx)}
                                                className="text-xs font-bold text-white bg-[#8A63D2] hover:bg-[#7854bc] px-4 py-2 rounded-lg flex items-center gap-2 transition-colors shadow-sm"
                                            >
                                                <Plus size={14} /> Add Option
                                            </button>
                                        </div>
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
                            className="w-full p-3 border border-gray-300 rounded-md text-sm outline-none focus:ring-1 focus:border-[#8A63D2] focus:ring-1 focus:ring-[#8A63D2] resize-none transition-all"
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
