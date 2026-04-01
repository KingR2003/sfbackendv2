import { Link, useSearchParams } from "react-router-dom";
import { SearchFilter } from "@/components/shared/SearchFilter";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { GlassCard } from "@/components/shared/GlassCard";
import { StatusBadge } from "@/components/shared/StatusBadge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Edit2, Search, ChevronDown, ChevronUp, Save, X, ChevronLeft, ChevronRight, Package, CheckCircle, AlertTriangle, Trash2, Image as ImageIcon, XCircle, ArrowUp, ArrowDown, Upload, ImagePlus, Check, Filter } from "lucide-react";
import { useState, useEffect, useRef } from "react";

import { Product, Variant } from "@/data/mockData";
import { getProducts, createProduct, updateProduct, getCategories, toggleProductStatus } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

function isCategoryActive(category: any): boolean {
  const raw = category?.is_active ?? category?.isActive ?? category?.active ?? category?.status;
  if (typeof raw === "boolean") return raw;
  if (typeof raw === "number") return raw === 1;
  if (typeof raw === "string") {
    const value = raw.trim().toLowerCase();
    if (value === "true" || value === "1" || value === "active") return true;
    if (value === "false" || value === "0" || value.includes("inactive")) return false;
  }
  return true;
}

const Products = () => {
  const { toast } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoadingList, setIsLoadingList] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const fetchProducts = async () => {
    setIsLoadingList(true);
    try {
      const data = await getProducts();
      setProducts(data);
    } catch (err: any) {
      console.error("Failed to fetch products:", err);
      toast({
        title: "Error Loading Products",
        description: err.message || "Failed to contact the backend.",
        variant: "destructive"
      });
    } finally {
      setIsLoadingList(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const [categoriesList, setCategoriesList] = useState<any[]>([]);

  const getCategoryName = (category: any): string => {
    if (!category) return "";
    return String(
      category.name ??
      category.categoryName ??
      category.category_name ??
      category.title ??
      category.label ??
      ""
    ).trim();
  };

  const fetchCategoriesList = async () => {
    try {
      const res: any = await getCategories();
      const list =
        res?.success && Array.isArray(res.data) ? res.data :
          Array.isArray(res) ? res :
            Array.isArray(res?.categories) ? res.categories :
              Array.isArray(res?.content) ? res.content :
                Array.isArray(res?.data?.categories) ? res.data.categories :
                  Array.isArray(res?.data?.content) ? res.data.content :
                    [];
      setCategoriesList(list);
      return list;
    } catch (err) {
      console.error("Failed to fetch categories:", err);
      return [];
    }
  };

  const resolveCategoryIdForProduct = async (product: Product): Promise<number | null> => {
    if (product.category_id != null) {
      return Number(product.category_id);
    }

    const findByName = (list: any[]) => list.find((c: any) =>
      getCategoryName(c).toLowerCase() === String(product.category ?? "").trim().toLowerCase()
    );

    const localMatch = findByName(categoriesList);
    if (localMatch?.id != null) return Number(localMatch.id);

    const latestCategories = await fetchCategoriesList();
    const fetchedMatch = findByName(latestCategories);
    if (fetchedMatch?.id != null) return Number(fetchedMatch.id);

    return null;
  };

  const getProductCategoryLabel = (product: Product): string => {
    const existing = String(product.category ?? "").trim();
    if (existing && existing.toLowerCase() !== "uncategorized") return existing;

    if (product.category_id != null) {
      const matched = categoriesList.find((c: any) => Number(c?.id) === Number(product.category_id));
      const categoryName = getCategoryName(matched);
      if (categoryName) return categoryName;
    }

    return existing || "Uncategorized";
  };

  useEffect(() => {
    fetchCategoriesList();
  }, []);

  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedProduct, setExpandedProduct] = useState<number | null>(null);
  const [featuredImgMap, setFeaturedImgMap] = useState<Record<number, number>>({});
  const [modalVariants, setModalVariants] = useState<Partial<Variant>[]>([{ variant_name: "", sku: "", mrp: 0, price: 0, discount: 0, stock_quantity: 0, sold: 0, availability_status: "In Stock", is_active: true, image: "", images: [] }]);
  const [modalProductImages, setModalProductImages] = useState<string[]>([]);

  // Single ref for product image file input
  const productImgInputRef = useRef<HTMLInputElement>(null);
  // Maps blob URL → original File, so we can append real files to FormData
  const blobUrlToFileRef = useRef<Map<string, File>>(new Map());
  // dragOver: 'product' | `variant-${idx}` | null
  const [dragOver, setDragOver] = useState<string | null>(null);
  const [modalImageIdx, setModalImageIdx] = useState(0);
  const [filterStatus, setFilterStatus] = useState<"All" | "Active" | "Inactive" | "LowStock">("All");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [stockFilter, setStockFilter] = useState<"All" | "OutOfStock" | "LowStock" | "MediumStock" | "HighStock">("All");
  const [availabilityFilter, setAvailabilityFilter] = useState<"All" | "InStock" | "LowStock" | "OutOfStock">("All");
  const [priceFilter, setPriceFilter] = useState<"All" | "Below100" | "100To500" | "500To1000" | "Above1000">("All");
  const [sortBy, setSortBy] = useState<"Newest" | "Oldest" | "NameAZ" | "NameZA" | "PriceLowHigh" | "PriceHighLow" | "StockLowHigh" | "StockHighLow">("Newest");
  const [searchParams] = useSearchParams();

  // Pre-apply filter from URL query param (e.g., ?filter=LowStock)
  useEffect(() => {
    const urlFilter = searchParams.get("filter");
    if (urlFilter === "LowStock" || urlFilter === "Active" || urlFilter === "Inactive") {
      setFilterStatus(urlFilter);
    }
  }, [searchParams]);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Category Dropdown State
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<any>(null);
  const activeCategories = categoriesList.filter((c: any) => isCategoryActive(c));

  const getPriceRangeLabel = (product: Product): string => {
    if (!Array.isArray(product.variants) || product.variants.length === 0) {
      return "-";
    }
    const prices = product.variants
      .map(v => Number(v.price))
      .filter((price) => Number.isFinite(price));
    if (prices.length === 0) return "-";
    return `₹${Math.min(...prices)} - ₹${Math.max(...prices)}`;
  };

  const categoryFilterOptions = Array.from(
    new Set(products.map((p) => getProductCategoryLabel(p)).filter(Boolean))
  ).sort((a, b) => a.localeCompare(b));

  const filtered = products.filter(p => {
    const term = searchTerm.toLowerCase();
    const categoryLabel = getProductCategoryLabel(p).toLowerCase();
    const totalStock = p.variants.reduce((acc, v) => acc + v.stock_quantity, 0);
    const prices = p.variants.map((v) => Number(v.price)).filter((price) => Number.isFinite(price));
    const minPrice = prices.length > 0 ? Math.min(...prices) : 0;
    const hasInStockVariant = p.variants.some((v) => {
      const status = String(v.availability_status ?? "").trim().toLowerCase();
      return status === "in stock" || status === "in_stock";
    });
    const hasLowStockVariant = p.variants.some((v) => {
      const status = String(v.availability_status ?? "").trim().toLowerCase();
      return status === "low stock" || status === "low_stock";
    });
    const hasOutOfStockVariant = p.variants.some((v) => {
      const status = String(v.availability_status ?? "").trim().toLowerCase();
      return status === "out of stock" || status === "out_of_stock";
    });

    const matchesSearch = p.name.toLowerCase().includes(term) ||
      p.description.toLowerCase().includes(term) ||
      categoryLabel.includes(term) ||
      p.variants.some(v =>
        (v.variant_name && v.variant_name.toLowerCase().includes(term)) ||
        (v.sku && v.sku.toLowerCase().includes(term))
      );

    const matchesCategory = categoryFilter === "All" || categoryLabel === categoryFilter.toLowerCase();

    const matchesStock =
      stockFilter === "All" ||
      (stockFilter === "OutOfStock" && totalStock <= 0) ||
      (stockFilter === "LowStock" && totalStock > 0 && totalStock <= 10) ||
      (stockFilter === "MediumStock" && totalStock > 10 && totalStock <= 50) ||
      (stockFilter === "HighStock" && totalStock > 50);

    const matchesAvailability =
      availabilityFilter === "All" ||
      (availabilityFilter === "InStock" && hasInStockVariant) ||
      (availabilityFilter === "LowStock" && hasLowStockVariant) ||
      (availabilityFilter === "OutOfStock" && hasOutOfStockVariant);

    const matchesPrice =
      priceFilter === "All" ||
      (priceFilter === "Below100" && minPrice < 100) ||
      (priceFilter === "100To500" && minPrice >= 100 && minPrice <= 500) ||
      (priceFilter === "500To1000" && minPrice > 500 && minPrice <= 1000) ||
      (priceFilter === "Above1000" && minPrice > 1000);

    const matchesAdvanced = matchesCategory && matchesStock && matchesAvailability && matchesPrice;

    if (filterStatus === "Active") return matchesSearch && p.is_active;
    if (filterStatus === "Inactive") return matchesSearch && !p.is_active;
    if (filterStatus === "LowStock") {
      return matchesSearch && matchesAdvanced && totalStock < 10;
    }
    return matchesSearch && matchesAdvanced;
  });

  const sortedProducts = [...filtered].sort((a, b) => {
    const aPrices = a.variants.map((v) => Number(v.price)).filter((price) => Number.isFinite(price));
    const bPrices = b.variants.map((v) => Number(v.price)).filter((price) => Number.isFinite(price));
    const aMinPrice = aPrices.length > 0 ? Math.min(...aPrices) : 0;
    const bMinPrice = bPrices.length > 0 ? Math.min(...bPrices) : 0;

    const aStock = a.variants.reduce((acc, v) => acc + v.stock_quantity, 0);
    const bStock = b.variants.reduce((acc, v) => acc + v.stock_quantity, 0);

    switch (sortBy) {
      case "Oldest":
        return Number(a.id) - Number(b.id);
      case "NameAZ":
        return a.name.localeCompare(b.name);
      case "NameZA":
        return b.name.localeCompare(a.name);
      case "PriceLowHigh":
        return aMinPrice - bMinPrice;
      case "PriceHighLow":
        return bMinPrice - aMinPrice;
      case "StockLowHigh":
        return aStock - bStock;
      case "StockHighLow":
        return bStock - aStock;
      case "Newest":
      default:
        return Number(b.id) - Number(a.id);
    }
  });

  const handleStatClick = (status: "All" | "Active" | "Inactive" | "LowStock") => {
    setFilterStatus(filterStatus === status ? "All" : status);
  };

  const resetAllFilters = () => {
    setSearchTerm("");
    setFilterStatus("All");
    setCategoryFilter("All");
    setStockFilter("All");
    setAvailabilityFilter("All");
    setPriceFilter("All");
    setSortBy("Newest");
  };

  const activeFilterCount = [
    filterStatus !== "All",
    categoryFilter !== "All",
    stockFilter !== "All",
    availabilityFilter !== "All",
    priceFilter !== "All",
    sortBy !== "Newest",
  ].filter(Boolean).length;

  const activeCount = products.filter(p => p.is_active).length;
  const inactiveCount = products.filter(p => !p.is_active).length;
  const lowStockCount = products.filter(p => p.variants.reduce((acc, v) => acc + v.stock_quantity, 0) < 10).length;

  const totalPages = Math.ceil(sortedProducts.length / itemsPerPage) || 1;
  const paginatedProducts = sortedProducts.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterStatus, categoryFilter, stockFilter, availabilityFilter, priceFilter, sortBy]);

  // Edit Product State
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // Form state for product
  const [formName, setFormName] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formIsActive, setFormIsActive] = useState(true);

  const handleEditProduct = async (e: React.MouseEvent, product: Product) => {
    e.stopPropagation();
    const latestCategories = await fetchCategoriesList();
    blobUrlToFileRef.current.clear();
    setSelectedProduct(product);
    setFormName(product.name);
    setFormDescription(product.description);
    setFormIsActive(product.is_active);
    setModalVariants(product.variants);
    setModalProductImages(product.images || [product.image]);
    setModalImageIdx(0);
    setSelectedCategory(
      latestCategories.find((c: any) => Number(c?.id) === Number(product.category_id)) ||
      latestCategories.find((c: any) => c.name === getProductCategoryLabel(product)) ||
      latestCategories[0] ||
      null
    );
    setShowModal(true);
  };

  const handleAddProduct = async () => {
    await fetchCategoriesList();
    blobUrlToFileRef.current.clear();
    setSelectedProduct(null);
    setFormName("");
    setFormDescription("");
    setFormIsActive(true);
    setModalVariants([{ variant_name: "", sku: "", mrp: 0, price: 0, discount: 0, stock_quantity: 0, sold: 0, availability_status: "In Stock", is_active: true, image: "", images: [] }]);
    setModalProductImages([]);
    setModalImageIdx(0);
    setSelectedCategory(null);
    setShowModal(true);
  };

  const handleSaveProduct = async () => {
    if (!formName.trim()) {
      toast({ title: "Validation Error", description: "Product Name is required.", variant: "destructive" });
      return;
    }
    if (!formDescription.trim()) {
      toast({ title: "Validation Error", description: "Product Description is required.", variant: "destructive" });
      return;
    }
    if (!selectedCategory) {
      toast({ title: "Validation Error", description: "Category is required.", variant: "destructive" });
      return;
    }
    const cleanImages = modalProductImages.filter(Boolean);
    if (cleanImages.length === 0) {
      toast({ title: "Validation Error", description: "At least one product image is required.", variant: "destructive" });
      return;
    }
    for (let i = 0; i < modalVariants.length; i++) {
      const v = modalVariants[i];
      if (!v.variant_name?.trim() || !v.sku?.trim() || v.mrp === undefined || v.mrp === "" || v.price === undefined || v.price === "" || v.stock_quantity === undefined || v.stock_quantity === "") {
        toast({ title: "Validation Error", description: `Please fill all required fields (Name, SKU, MRP, Price, Stock) for Variant ${i + 1}.`, variant: "destructive" });
        return;
      }
      if (!v.images || v.images.filter(Boolean).length === 0) {
        toast({ title: "Validation Error", description: `At least one image is required for Variant ${i + 1}.`, variant: "destructive" });
        return;
      }
    }

    const updatedVariants = modalVariants.map((v, i) => ({
      id: v.id ?? Date.now() + i,
      variant_name: v.variant_name || "",
      sku: v.sku || "",
      mrp: v.mrp ?? 0,
      price: v.price ?? 0,
      discount: v.discount ?? 0,
      stock_quantity: v.stock_quantity ?? 0,
      sold: v.sold ?? 0,
      availability_status: (v.stock_quantity ?? 0) <= 0
        ? "Out of Stock"
        : (v.stock_quantity ?? 0) <= 30
          ? "Low Stock"
          : "In Stock",
      is_active: v.is_active ?? true,
      image: (v.images && v.images.filter(Boolean)[0]) || v.image || "",
      images: (v.images || []).filter(Boolean),
    }));

    // Build references for both existing remote URLs and newly uploaded files.
    const productImageRefs: { imageUrl: string }[] = [];
    const productImageEntries: { file: File; name: string }[] = [];
    modalProductImages.filter(Boolean).forEach(url => {
      const file = blobUrlToFileRef.current.get(url);
      if (file) {
        productImageEntries.push({ file, name: file.name });
        productImageRefs.push({ imageUrl: file.name });
      } else {
        productImageRefs.push({ imageUrl: url });
      }
    });

    const variantImageEntriesMap: { file: File; name: string }[][] = [];
    const variantImageRefsMap: { imageUrl: string }[][] = [];
    modalVariants.forEach(v => {
      const entries: { file: File; name: string }[] = [];
      const refs: { imageUrl: string }[] = [];
      (v.images || []).filter(Boolean).forEach(url => {
        const file = blobUrlToFileRef.current.get(url);
        if (file) {
          entries.push({ file, name: file.name });
          refs.push({ imageUrl: file.name });
        } else {
          refs.push({ imageUrl: url });
        }
      });
      variantImageEntriesMap.push(entries);
      variantImageRefsMap.push(refs);
    });

    const productPayload = {
      name: formName,
      description: formDescription,
      isActive: formIsActive,
      categoryId: (selectedCategory as any)?.id || 1,
      images: productImageRefs,
      variants: updatedVariants.map((v, idx) => ({
        id: v.id,
        variantName: v.variant_name,
        sku: v.sku,
        mrp: v.mrp,
        price: v.price,
        discount: v.discount,
        stockQuantity: v.stock_quantity,
        availabilityStatus:
          (v.stock_quantity ?? 0) <= 0 ? "OUT_OF_STOCK" :
          (v.stock_quantity ?? 0) <= 30 ? "LOW_STOCK" : "IN_STOCK",
        isActive: v.is_active,
        images: variantImageRefsMap[idx] || [],
      })),
    };

    const formData = new FormData();
    formData.append("product", JSON.stringify(productPayload));
    productImageEntries.forEach(e => formData.append("image", e.file));
    variantImageEntriesMap.forEach(entries => entries.forEach(e => formData.append("image", e.file)));

    if (selectedProduct) {
      setIsSaving(true);
      try {
        const res: any = await updateProduct(selectedProduct.id, formData);
        if (res?.success === false) {
          throw new Error(res?.message || "Failed to update product.");
        }
        toast({
          title: "Success",
          description: `Product "${formName}" updated successfully!`,
        });
        setShowModal(false);
        setSelectedProduct(null);
        setFilterStatus("All");
        setCurrentPage(1);
        await fetchProducts();
      } catch (err: any) {
        console.error("API error updating product:", err);
        toast({ title: "Error", description: err.message || "Failed to update product.", variant: "destructive" });
      } finally {
        setIsSaving(false);
      }
    } else {
      // Create new product with FormData (backend does not support application/json)
      setIsSaving(true);
      try {
        const res: any = await createProduct(formData);
        if (res.success || res.id) {
          toast({
              title: "Success",
              description: `Product "${formName}" was successfully added!`,
          });
          setShowModal(false);
          setSelectedProduct(null);
          setFilterStatus("All");
          setCurrentPage(1);
          await fetchProducts();
        } else {
          console.error("Failed to create product via API:", res);
          toast({ title: "Error", description: res.message || "Failed to create product via backend.", variant: "destructive" });
        }
      } catch (err: any) {
        console.error("API error creating product:", err);
        toast({ title: "Network error.", description: err.message, variant: "destructive" });
      } finally {
        setIsSaving(false);
      }
    }
  }

  const addVariantRow = () => {
    setModalVariants([...modalVariants, { variant_name: "", sku: "", mrp: 0, price: 0, discount: 0, stock_quantity: 0, sold: 0, availability_status: "In Stock", is_active: true, image: "", images: [] }]);
  };

  const removeVariantRow = (idx: number) => {
    if (modalVariants.length > 1) {
      setModalVariants(modalVariants.filter((_, i) => i !== idx));
    }
  };

  // Edit Variant Modal State
  const [showEditVariantModal, setShowEditVariantModal] = useState(false);
  const [selectedVariant, setSelectedVariant] = useState<Variant | null>(null);
  const [editVariantName, setEditVariantName] = useState<string>("");
  const [editSku, setEditSku] = useState<string>("");
  const [editMrp, setEditMrp] = useState<string>("");
  const [editDiscount, setEditDiscount] = useState<string>("");
  const [editPrice, setEditPrice] = useState<string>("");
  const [editStock, setEditStock] = useState<string>("");
  const [editImages, setEditImages] = useState<string[]>([]);
  const [editIsActive, setEditIsActive] = useState<boolean>(true);
  const [editDragOver, setEditDragOver] = useState<boolean>(false);
  const [deactivateDialog, setDeactivateDialog] = useState<{ message: string; onConfirm: () => void } | null>(null);

  // Image Lightbox State
  const [lightboxImages, setLightboxImages] = useState<string[]>([]);
  const [lightboxIndex, setLightboxIndex] = useState<number>(0);
  const [lightboxLabel, setLightboxLabel] = useState<string>("");

  const openLightbox = (e: React.MouseEvent, images: string[], index: number, label: string) => {
    e.stopPropagation();
    setLightboxImages(images);
    setLightboxIndex(index);
    setLightboxLabel(label);
  };

  const handleVariantClick = (e: React.MouseEvent, variant: Variant) => {
    e.stopPropagation();
    setSelectedVariant(variant);
    setEditVariantName(variant.variant_name || "");
    setEditSku(variant.sku || "");
    setEditMrp(variant.mrp?.toString() || "");
    setEditDiscount(variant.discount?.toString() || "");
    setEditPrice(variant.price.toString());
    setEditStock(variant.stock_quantity.toString());
    setEditImages(variant.images?.filter(Boolean) || (variant.image ? [variant.image] : []));
    setEditIsActive(variant.is_active !== false); // default true
    setShowEditVariantModal(true);
  };

  const handleToggleProduct = (e: React.MouseEvent, productId: number) => {
    e.stopPropagation();
    const targetProduct = products.find(p => p.id === productId);
    if (!targetProduct) return;
    const newActive = !targetProduct.is_active;

    const applyToggle = async () => {
      setProducts(prev => prev.map(p => {
        if (p.id !== productId) return p;
        return { ...p, is_active: newActive, variants: p.variants.map(v => ({ ...v, is_active: newActive })) };
      }));
      try {
        await toggleProductStatus(productId);
      } catch (err: any) {
        // Roll back
        setProducts(prev => prev.map(p => {
          if (p.id !== productId) return p;
          return { ...p, is_active: !newActive, variants: targetProduct.variants };
        }));
        toast({ title: "Error", description: err.message || "Failed to update product status.", variant: "destructive" });
      }
    };

    if (!newActive) {
      setDeactivateDialog({
        message: "Are you sure you want to deactivate this product?",
        onConfirm: applyToggle,
      });
    } else {
      applyToggle();
    }
  };

  const handleToggleVariant = (e: React.MouseEvent, productId: number, variantId: number) => {
    e.stopPropagation();
    const parentProduct = products.find(p => p.id === productId);
    const targetVariant = parentProduct?.variants.find(v => v.id === variantId);
    if (!targetVariant) return;
    const newActive = !targetVariant.is_active;

    const applyToggle = async () => {
      // Build updated variants list for the backend payload
      const updatedVariants = (parentProduct?.variants ?? []).map(v =>
        v.id === variantId ? { ...v, is_active: newActive } : v
      );
      
      const updatedProductIsActive = updatedVariants.some(v => v.is_active);

      setProducts(prev => prev.map(p =>
        p.id === productId ? { ...p, is_active: updatedProductIsActive, variants: updatedVariants } : p
      ));
      try {
        const categoryId = parentProduct ? await resolveCategoryIdForProduct(parentProduct) : null;
        if (!categoryId) {
          throw new Error("Category is required and must be valid.");
        }
        const fd = new FormData();
        fd.append("product", JSON.stringify({
          name: parentProduct?.name,
          description: parentProduct?.description,
          isActive: updatedProductIsActive,
          categoryId,
          images: (parentProduct?.images || []).map(url => ({ imageUrl: url })),
          variants: updatedVariants.map(v => ({
            id: v.id,
            variantName: v.variant_name,
            sku: v.sku,
            mrp: v.mrp,
            price: v.price,
            discount: v.discount,
            stockQuantity: v.stock_quantity,
            availabilityStatus: v.availability_status,
            isActive: v.is_active,
            images: (v.images || []).map(url => ({ imageUrl: url })),
          })),
        }));
        await updateProduct(productId, fd);
      } catch (err: any) {
        // Roll back
        setProducts(prev => prev.map(p =>
          p.id === productId
            ? { ...p, is_active: parentProduct?.is_active, variants: p.variants.map(v => v.id === variantId ? { ...v, is_active: !newActive } : v) }
            : p
        ));
        toast({ title: "Error", description: err.message || "Failed to update variant status.", variant: "destructive" });
      }
    };

    if (!newActive) {
      setDeactivateDialog({
        message: "Are you sure you want to deactivate this variant?",
        onConfirm: applyToggle,
      });
    } else {
      applyToggle();
    }
  };

  // Helper to update specific variant field in modal (if we were fully controlled)
  // For now, let's ensure the inputs in the modal use `defaultValue` if `selectedProduct` is set,
  // or simple state if we want to be robust.
  // ... refactoring to controlled inputs is safer for "Edit" ...

  return (
    <DashboardLayout>
      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5 mt-4">
        {/* ... existing stat cards ... */}

        {/* Total Products */}
        <GlassCard className={`p-4 flex items-center justify-between gap-4 cursor-pointer transition-all ${filterStatus === 'All' ? 'ring-2 ring-primary/50' : ''}`} onClick={() => handleStatClick("All")}> 
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center">
              <Package className="w-6 h-6 text-blue-500" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Total Products</p>
              <p className="text-xl font-bold text-foreground">{products.length}</p>
            </div>
          </div>
          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={(e) => { e.stopPropagation(); handleAddProduct(); }}
            className="w-10 h-10 rounded-full gradient-green flex items-center justify-center text-primary-foreground shadow-lg green-glow">
            <Plus className="w-5 h-5" />
          </motion.button>
        </GlassCard>

        {/* Active Products */}
        <GlassCard className={`p-4 flex items-center gap-4 cursor-pointer transition-all ${filterStatus === 'Active' ? 'ring-2 ring-green-500/50' : ''}`} onClick={() => handleStatClick("Active")}> 
          <div className="w-12 h-12 rounded-2xl bg-green-500/10 flex items-center justify-center">
            <CheckCircle className="w-6 h-6 text-green-500" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Active Products</p>
            <p className="text-xl font-bold text-foreground">{activeCount}</p>
          </div>
        </GlassCard>

        {/* Inactive Products */}
        <GlassCard className={`p-4 flex items-center gap-4 cursor-pointer transition-all ${filterStatus === 'Inactive' ? 'ring-2 ring-orange-500/50' : ''}`} onClick={() => handleStatClick("Inactive")}> 
          <div className="w-12 h-12 rounded-2xl bg-orange-500/10 flex items-center justify-center">
            <XCircle className="w-6 h-6 text-orange-500" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Inactive Products</p>
            <p className="text-xl font-bold text-foreground">{inactiveCount}</p>
          </div>
        </GlassCard>

      </div>

      {/* Table */}
      <GlassCard className="p-0 overflow-hidden flex flex-col"> 
        <div className="p-4 border-b border-border/50">
          <div className="flex flex-col md:flex-row md:items-center gap-3">
            <SearchFilter
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              placeholder="Search products, SKUs, variants..."
              className="flex-1"
            />

            <div className="flex items-center gap-3 md:justify-end">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-muted/40 text-foreground hover:bg-muted transition-all border border-border">
                  <Filter className="w-3.5 h-3.5" />
                  {activeFilterCount > 0 ? `Filtered (${activeFilterCount})` : "All"}
                  <ChevronDown className="w-3 h-3" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-64 rounded-xl border border-border bg-card shadow-elevated p-1 max-h-[70vh] overflow-y-auto">
                <div className="px-2 py-1.5">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Status</p>
                </div>
                {[
                  { label: "All", value: "All" },
                  { label: "Active", value: "Active" },
                  { label: "Inactive", value: "Inactive" },
                  { label: "Low Stock", value: "LowStock" },
                ].map((opt) => (
                  <DropdownMenuCheckboxItem
                    key={`status-${opt.value}`}
                    checked={filterStatus === opt.value}
                    onCheckedChange={() => setFilterStatus(opt.value as "All" | "Active" | "Inactive" | "LowStock")}
                    className="rounded-lg py-2 cursor-pointer transition-colors focus:bg-primary/10 focus:text-primary"
                  >
                    {opt.label}
                  </DropdownMenuCheckboxItem>
                ))}

                <DropdownMenuSeparator className="my-1 opacity-50" />
                <div className="px-2 py-1.5">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Category</p>
                </div>
                {[{ label: "All", value: "All" }, ...categoryFilterOptions.map((label) => ({ label, value: label }))].map((opt) => (
                  <DropdownMenuCheckboxItem
                    key={`category-${opt.value}`}
                    checked={categoryFilter === opt.value}
                    onCheckedChange={() => setCategoryFilter(opt.value)}
                    className="rounded-lg py-2 cursor-pointer transition-colors focus:bg-primary/10 focus:text-primary"
                  >
                    {opt.label}
                  </DropdownMenuCheckboxItem>
                ))}

                <DropdownMenuSeparator className="my-1 opacity-50" />
                <div className="px-2 py-1.5">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Stock Level</p>
                </div>
                {[
                  { label: "All", value: "All" },
                  { label: "Out of Stock", value: "OutOfStock" },
                  { label: "Low (1-10)", value: "LowStock" },
                  { label: "Medium (11-50)", value: "MediumStock" },
                  { label: "High (50+)", value: "HighStock" },
                ].map((opt) => (
                  <DropdownMenuCheckboxItem
                    key={`stock-${opt.value}`}
                    checked={stockFilter === opt.value}
                    onCheckedChange={() => setStockFilter(opt.value as "All" | "OutOfStock" | "LowStock" | "MediumStock" | "HighStock")}
                    className="rounded-lg py-2 cursor-pointer transition-colors focus:bg-primary/10 focus:text-primary"
                  >
                    {opt.label}
                  </DropdownMenuCheckboxItem>
                ))}

                <DropdownMenuSeparator className="my-1 opacity-50" />
                <div className="px-2 py-1.5">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Availability</p>
                </div>
                {[
                  { label: "All", value: "All" },
                  { label: "In Stock", value: "InStock" },
                  { label: "Low Stock", value: "LowStock" },
                  { label: "Out of Stock", value: "OutOfStock" },
                ].map((opt) => (
                  <DropdownMenuCheckboxItem
                    key={`availability-${opt.value}`}
                    checked={availabilityFilter === opt.value}
                    onCheckedChange={() => setAvailabilityFilter(opt.value as "All" | "InStock" | "LowStock" | "OutOfStock")}
                    className="rounded-lg py-2 cursor-pointer transition-colors focus:bg-primary/10 focus:text-primary"
                  >
                    {opt.label}
                  </DropdownMenuCheckboxItem>
                ))}

                <DropdownMenuSeparator className="my-1 opacity-50" />
                <div className="px-2 py-1.5">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Price Range</p>
                </div>
                {[
                  { label: "All", value: "All" },
                  { label: "Below Rs.100", value: "Below100" },
                  { label: "Rs.100 - Rs.500", value: "100To500" },
                  { label: "Rs.500 - Rs.1000", value: "500To1000" },
                  { label: "Above Rs.1000", value: "Above1000" },
                ].map((opt) => (
                  <DropdownMenuCheckboxItem
                    key={`price-${opt.value}`}
                    checked={priceFilter === opt.value}
                    onCheckedChange={() => setPriceFilter(opt.value as "All" | "Below100" | "100To500" | "500To1000" | "Above1000")}
                    className="rounded-lg py-2 cursor-pointer transition-colors focus:bg-primary/10 focus:text-primary"
                  >
                    {opt.label}
                  </DropdownMenuCheckboxItem>
                ))}

                <DropdownMenuSeparator className="my-1 opacity-50" />
                <div className="px-2 py-1.5">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Sort</p>
                </div>
                {[
                  { label: "Newest First", value: "Newest" },
                  { label: "Oldest First", value: "Oldest" },
                  { label: "Name A-Z", value: "NameAZ" },
                  { label: "Name Z-A", value: "NameZA" },
                  { label: "Price Low-High", value: "PriceLowHigh" },
                  { label: "Price High-Low", value: "PriceHighLow" },
                  { label: "Stock Low-High", value: "StockLowHigh" },
                  { label: "Stock High-Low", value: "StockHighLow" },
                ].map((opt) => (
                  <DropdownMenuCheckboxItem
                    key={`sort-${opt.value}`}
                    checked={sortBy === opt.value}
                    onCheckedChange={() => setSortBy(opt.value as "Newest" | "Oldest" | "NameAZ" | "NameZA" | "PriceLowHigh" | "PriceHighLow" | "StockLowHigh" | "StockHighLow")}
                    className="rounded-lg py-2 cursor-pointer transition-colors focus:bg-primary/10 focus:text-primary"
                  >
                    {opt.label}
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {activeFilterCount > 0 && (
              <button
                type="button"
                onClick={resetAllFilters}
                className="text-xs text-muted-foreground hover:text-destructive transition-colors"
              >
                Clear All
              </button>
            )}
            </div>
          </div>
        </div>
        <div className="overflow-x-auto flex-1 relative min-h-[400px]">
          {isLoadingList ? (
            <div className="absolute inset-0 flex items-center justify-center p-12 bg-background/50 backdrop-blur-sm z-10 w-full">
              <div className="w-8 h-8 rounded-full border-4 border-primary/30 border-t-primary animate-spin" />
            </div>
          ) : null}
          <table className="w-full">
            {/* ... */}
            <thead>
              <tr className="text-left text-sm font-medium text-muted-foreground border-b border-border/50">
                <th className="pb-3 px-5">Product</th>
                <th className="pb-3 px-5">Category</th>
                <th className="pb-3 px-5">Price Range</th>
                <th className="pb-3 px-5">Stock</th>
                <th className="pb-3 px-5">Sold</th>
                <th className="pb-3 px-5">Active</th>
                <th className="pb-3 px-5">Status</th>
                <th className="pb-3 px-5">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedProducts.map((product) => (
                <>
                  <motion.tr key={product.id} whileHover={{ backgroundColor: "hsla(130, 85%, 45%, 0.04)" }}
                    className="border-b border-border/50 cursor-pointer" onClick={() => setExpandedProduct(expandedProduct === product.id ? null : product.id)}>
                    <td className="py-3.5 px-5">
                      <div className="flex items-center gap-3">
                        {/* Product thumbnail: show image if available, else professional placeholder */}
                        {product.images && product.images.length > 0 && product.images[0] ? (
                          <img
                            src={product.images[0]}
                            alt={product.name}
                            onClick={(e) => openLightbox(e, product.images, 0, product.name)}
                            className="w-10 h-10 rounded-lg object-cover cursor-zoom-in hover:ring-2 hover:ring-primary/50 transition-all border border-border/30 flex-shrink-0"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-muted/60 border border-border/40 flex items-center justify-center flex-shrink-0">
                            <ImageIcon className="w-4 h-4 text-muted-foreground/50" />
                          </div>
                        )}
                        <div>
                          <p className="font-medium text-foreground">{product.name}</p>
                          <p className="text-xs text-muted-foreground truncate max-w-[150px]">{product.description}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-5 text-sm text-muted-foreground">
                      <Link to={`/category/${encodeURIComponent(getProductCategoryLabel(product))}`} onClick={(e) => e.stopPropagation()} className="hover:text-primary hover:underline transition-colors">
                        {getProductCategoryLabel(product)}
                      </Link>
                    </td>
                    <td className="py-3.5 px-5 text-sm font-medium text-foreground">
                      {getPriceRangeLabel(product)}
                    </td>
                    <td className="py-3.5 px-5 text-sm text-muted-foreground">
                      {product.variants.reduce((acc, v) => acc + v.stock_quantity, 0)} Units
                    </td>
                    <td className="py-3.5 px-5">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden min-w-[60px]">
                          <div
                            className="h-full bg-amber-500 rounded-full"
                            style={{ width: `${Math.min(100, ((product.sold ?? 0) / Math.max(1, (product.sold ?? 0) + product.variants.reduce((acc, v) => acc + v.stock_quantity, 0))) * 100)}%` }}
                          />
                        </div>
                        <span className="text-xs font-medium text-amber-600 whitespace-nowrap">{(product.sold ?? 0).toLocaleString()}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-5">
                      <button
                        onClick={(e) => handleToggleProduct(e, product.id)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${product.is_active ? 'bg-primary' : 'bg-muted-foreground/30'
                          }`}
                        title={product.is_active ? 'Active — click to deactivate' : 'Inactive — click to activate'}
                      >
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${product.is_active ? 'translate-x-6' : 'translate-x-1'
                          }`} />
                      </button>
                    </td>
                    <td className="py-3.5 px-5">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${product.is_active
                        ? 'bg-green-500/10 text-green-600'
                        : 'bg-red-500/10 text-red-500'
                        }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${product.is_active ? 'bg-green-500' : 'bg-red-500'
                          }`} />
                        {product.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="py-3.5 px-5">
                      <button onClick={(e) => handleEditProduct(e, product)} className="p-2 rounded-lg hover:bg-accent transition-colors">
                        <Edit2 className="w-4 h-4 text-muted-foreground" />
                      </button>
                    </td>
                  </motion.tr>
                  {expandedProduct === product.id && (
                    <motion.tr initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-muted/30">
                      <td colSpan={8} className="p-4">
                        <div className="bg-background/50 rounded-xl p-5 border border-border/50">



                          <h4 className="font-semibold mb-3 text-sm">Product Variants</h4>
                          <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                              <thead>
                                <tr className="border-b border-border/50 text-left text-muted-foreground">
                                  <th className="pb-2 font-medium w-20">Image</th>
                                  <th className="pb-2 font-medium">Variant</th>
                                  <th className="pb-2 font-medium">SKU</th>
                                  <th className="pb-2 font-medium">Price</th>
                                  <th className="pb-2 font-medium">Stock</th>
                                  <th className="pb-2 font-medium">Sold</th>
                                  <th className="pb-2 font-medium">Active</th>
                                  <th className="pb-2 font-medium">Status</th>
                                  <th className="pb-2 font-medium text-right">Actions</th>
                                </tr>
                              </thead>
                              <tbody>
                                {product.variants.map((variant) => {
                                  const vImg = (variant.images && variant.images.filter(Boolean).length > 0)
                                    ? variant.images.filter(Boolean)[0]
                                    : (variant.image || null);
                                  return (
                                    <tr key={variant.id} className="border-b border-border/50 last:border-0">
                                      <td className="py-2">
                                        {vImg ? (
                                          <img
                                            src={vImg}
                                            alt={variant.variant_name}
                                            onClick={(e) => openLightbox(e, variant.images?.filter(Boolean) || [vImg], 0, variant.variant_name)}
                                            className="w-9 h-9 rounded-lg object-cover cursor-zoom-in border border-border/30"
                                          />
                                        ) : (
                                          <div className="w-9 h-9 rounded-lg bg-muted/60 border border-border/40 flex items-center justify-center">
                                            <ImageIcon className="w-3.5 h-3.5 text-muted-foreground/40" />
                                          </div>
                                        )}
                                      </td>
                                      <td className="py-2 font-medium">{variant.variant_name}</td>
                                      <td className="py-2 text-muted-foreground text-xs">{variant.sku}</td>
                                      <td className="py-2 font-semibold">₹{variant.price}</td>
                                      <td className="py-2">{variant.stock_quantity} units</td>
                                      <td className="py-2">
                                        <span className="text-amber-600 font-medium">{(variant.sold ?? 0).toLocaleString()}</span>
                                      </td>
                                      <td className="py-2">
                                        <button
                                          onClick={(e) => handleToggleVariant(e, product.id, variant.id)}
                                          className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none ${variant.is_active !== false ? 'bg-primary' : 'bg-muted-foreground/30'
                                            }`}
                                          title={variant.is_active !== false ? 'Active — click to deactivate' : 'Inactive — click to activate'}
                                        >
                                          <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${variant.is_active !== false ? 'translate-x-[18px]' : 'translate-x-0.5'
                                            }`} />
                                        </button>
                                      </td>
                                      <td className="py-2">
                                        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium ${variant.is_active !== false
                                          ? 'bg-green-500/10 text-green-600'
                                          : 'bg-red-500/10 text-red-500'
                                          }`}>
                                          <span className={`w-1.5 h-1.5 rounded-full ${variant.is_active !== false ? 'bg-green-500' : 'bg-red-500'
                                            }`} />
                                          {variant.is_active !== false ? 'Active' : 'Inactive'}
                                        </span>
                                      </td>
                                      <td className="py-2 text-right">
                                        <button onClick={(e) => handleVariantClick(e, variant)} className="p-1.5 rounded-lg hover:bg-accent transition-colors" title="Edit variant">
                                          <Edit2 className="w-3.5 h-3.5 text-muted-foreground" />
                                        </button>
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </td>
                    </motion.tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
        </div>
        {/* Pagination */}
        <div className="flex items-center justify-between px-5 py-4 border-t border-border/50 bg-muted/10">
          <span className="text-xs text-muted-foreground">Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filtered.length)} of {filtered.length} entries</span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="px-3 py-1.5 rounded-lg hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed text-xs font-medium text-foreground"
            >
              Previous
            </button>
            <span className="text-xs font-medium text-foreground">Page {currentPage} of {totalPages}</span>
            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="px-3 py-1.5 rounded-lg hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed text-xs font-medium text-foreground"
            >
              Next
            </button>
          </div>
        </div>
      </GlassCard>

      {/* Add/Edit Product Modal */}
      {showModal && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 z-[100] flex items-center justify-center">
          <div className="absolute inset-0 bg-foreground/20 backdrop-blur-sm" onClick={() => setShowModal(false)} />
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            className="glass-strong shadow-elevated rounded-2xl p-8 w-full max-w-4xl relative z-10 mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6 pb-6 border-b border-border/50">
              <div>
                <h2 className="text-2xl font-bold text-foreground">{selectedProduct ? "Edit Product" : "Add New Product"}</h2>
                <p className="text-sm text-muted-foreground mt-1">Manage product details and variants</p>
              </div>
              <button onClick={() => setShowModal(false)} className="w-8 h-8 rounded-lg hover:bg-muted/50 flex items-center justify-center transition-colors">
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Left Side - Form Fields */}
              <div className="lg:col-span-2 space-y-5">
                <div>
                  <label className="text-sm font-semibold text-foreground mb-2 block">Product Name <span className="text-destructive">*</span></label>
                  <input
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-muted/50 border border-border text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                    placeholder="Enter product name"
                  />
                </div>
                <div>
                  <label className="text-sm font-semibold text-foreground mb-2 block">Description <span className="text-destructive">*</span></label>
                  <textarea
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-muted/50 border border-border text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all resize-none h-24"
                    placeholder="Enter detailed product description"
                  />
                </div>

                <div>
                  <div className="relative">
                    <label className="text-sm font-semibold text-foreground mb-2 block">Category <span className="text-destructive">*</span></label>
                    <button onClick={() => setIsCategoryOpen(!isCategoryOpen)} className="w-full px-4 py-3 rounded-xl bg-muted/50 border border-border text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all flex items-center justify-between hover:bg-muted/70">
                      <div className="flex items-center gap-2">
                        {selectedCategory?.image && <img src={selectedCategory.image} className="w-6 h-6 rounded-full object-cover" />}
                        <span className="font-medium">{selectedCategory ? (selectedCategory.name || "Select a category") : "Select a category"}</span>
                      </div>
                      <ChevronDown className="w-4 h-4 text-muted-foreground" />
                    </button>
                    {isCategoryOpen && activeCategories.length > 0 && (
                      <div className="absolute top-full left-0 w-full mt-2 bg-popover border border-border rounded-xl shadow-2xl overflow-hidden z-20">
                        {activeCategories.map((cat) => (
                          <div key={cat.name || cat.id} onClick={() => { setSelectedCategory(cat); setIsCategoryOpen(false); }} className="flex items-center gap-3 px-4 py-3 hover:bg-muted cursor-pointer transition-colors border-b border-border/30 last:border-0">
                            {cat.image && <img src={cat.image} className="w-8 h-8 rounded-full object-cover" />}
                            <span className="text-sm font-medium text-foreground">{cat.name}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Right Side — Product Image (single) */}
              <div className="lg:col-span-1 flex flex-col gap-3">
                <label className="text-sm font-semibold text-foreground">Product Image <span className="text-destructive">*</span></label>

                <div
                  onClick={() => productImgInputRef.current?.click()}
                  onDragOver={(e) => { e.preventDefault(); setDragOver('product'); }}
                  onDragLeave={() => setDragOver(null)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setDragOver(null);
                    const file = Array.from(e.dataTransfer.files).find(f => f.type.startsWith('image/'));
                    if (file) {
                      const url = URL.createObjectURL(file);
                      blobUrlToFileRef.current.set(url, file);
                      setModalProductImages([url]);
                    }
                  }}
                  className={`relative cursor-pointer rounded-xl border-2 border-dashed transition-all duration-200 flex flex-col items-center justify-center gap-3 py-8 px-4 text-center
                    ${dragOver === 'product'
                      ? 'border-primary bg-primary/5 scale-[1.01]'
                      : 'border-border/60 bg-muted/20 hover:border-primary/50 hover:bg-muted/30'}`}
                >
                  {modalProductImages.filter(Boolean).length > 0 ? (
                    <div className="relative w-full">
                      <img
                        src={modalProductImages.filter(Boolean)[0]}
                        alt="Product"
                        className="w-full h-40 object-cover rounded-lg border border-border/40"
                      />
                      <button
                        onClick={(e) => { e.stopPropagation(); setModalProductImages([]); }}
                        className="absolute top-1 right-1 w-5 h-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center shadow-md leading-none"
                      >×</button>
                      <p className="text-[10px] text-muted-foreground mt-2 text-center">Click or drag to replace</p>
                    </div>
                  ) : (
                    <>
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${dragOver === 'product' ? 'bg-primary/10' : 'bg-muted'}`}>
                        <Upload className={`w-5 h-5 transition-colors ${dragOver === 'product' ? 'text-primary' : 'text-muted-foreground'}`} />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-foreground">
                          {dragOver === 'product' ? 'Drop to upload' : 'Drag & drop photo here'}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">or <span className="text-primary font-medium">click to browse</span></p>
                        <p className="text-[10px] text-muted-foreground/60 mt-1">JPG, PNG, WebP</p>
                      </div>
                    </>
                  )}
                  <input
                    ref={productImgInputRef}
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        const file = e.target.files[0];
                        const url = URL.createObjectURL(file);
                        blobUrlToFileRef.current.set(url, file);
                        setModalProductImages([url]);
                        e.target.value = '';
                      }
                    }}
                  />
                </div>
              </div>
            </div>



            {/* Variants Section - Full Width */}
            <div className="space-y-4 mt-8">
              <div className="pt-6 border-t border-border/50">
                <div className="mb-5">
                  <div>
                    <h3 className="text-lg font-bold text-foreground">Product Variants</h3>
                  </div>
                </div>
                <div className="space-y-4">
                  {modalVariants.map((v, idx) => (
                    <div key={idx} className="p-5 rounded-xl bg-muted/30 border border-border/50 space-y-4 hover:border-border transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                            <span className="text-sm font-bold text-primary">{idx + 1}</span>
                          </div>
                          <span className="text-sm font-semibold text-foreground">Variant {idx + 1}</span>
                        </div>
                        {modalVariants.length > 1 && (
                          <button onClick={() => removeVariantRow(idx)} className="px-3 py-1.5 rounded-lg text-xs text-destructive hover:bg-destructive/10 transition-colors font-medium flex items-center gap-1">
                            <Trash2 className="w-3 h-3" />
                            Remove
                          </button>
                        )}
                      </div>
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <label className="text-xs font-semibold text-foreground">
                            Variant Images <span className="text-destructive">*</span>
                          </label>
                          {(v.images && v.images.filter(Boolean).length > 0) && (
                            <span className="text-[10px] bg-muted/50 px-2 py-0.5 rounded-full text-muted-foreground">
                              {v.images.filter(Boolean).length} photo{v.images.filter(Boolean).length > 1 ? 's' : ''}
                            </span>
                          )}
                        </div>

                        {/* Drag & Drop Zone */}
                        <div
                          onDragOver={(e) => { e.preventDefault(); setDragOver(`variant-${idx}`); }}
                          onDragLeave={() => setDragOver(null)}
                          onDrop={(e) => {
                            e.preventDefault();
                            setDragOver(null);
                            const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'));
                            if (files.length) {
                              const newUrls = files.map(f => {
                                const url = URL.createObjectURL(f);
                                blobUrlToFileRef.current.set(url, f);
                                return url;
                              });
                              const nv = [...modalVariants];
                              nv[idx].images = [...(nv[idx].images || []).filter(Boolean), ...newUrls];
                              nv[idx].image = nv[idx].images![0];
                              setModalVariants(nv);
                            }
                          }}
                          onClick={() => {
                            const inp = document.getElementById(`variant-img-input-${idx}`) as HTMLInputElement;
                            inp?.click();
                          }}
                          className={`cursor-pointer rounded-xl border-2 border-dashed transition-all duration-200 flex items-center gap-3 px-4 py-3 ${dragOver === ('variant-' + idx) ? 'border-primary bg-primary/5' : 'border-border/60 bg-muted/20 hover:border-primary/50 hover:bg-muted/30'}`}
                        >
                          <div className={`w-9 h-9 rounded-lg flex-shrink-0 flex items-center justify-center transition-colors ${dragOver === ('variant-' + idx) ? 'bg-primary/10' : 'bg-muted'}`}>
                            <ImagePlus className={`w-4 h-4 transition-colors ${dragOver === ('variant-' + idx) ? 'text-primary' : 'text-muted-foreground'}`} />
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-foreground">
                              {dragOver === ('variant-' + idx) ? 'Drop images here' : 'Drag & drop or click to upload'}
                            </p>
                            <p className="text-[10px] text-muted-foreground mt-0.5">JPG, PNG, WebP · Multiple files</p>
                          </div>
                          <input
                            id={`variant-img-input-${idx}`}
                            type="file"
                            className="hidden"
                            accept="image/*"
                            multiple
                            onChange={(e) => {
                              if (e.target.files) {
                                const newUrls = Array.from(e.target.files).map(f => {
                                  const url = URL.createObjectURL(f);
                                  blobUrlToFileRef.current.set(url, f);
                                  return url;
                                });
                                const nv = [...modalVariants];
                                nv[idx].images = [...(nv[idx].images || []).filter(Boolean), ...newUrls];
                                nv[idx].image = nv[idx].images![0];
                                setModalVariants(nv);
                                e.target.value = '';
                              }
                            }}
                          />
                        </div>

                        {/* Uploaded images grid */}
                        {(v.images && v.images.filter(Boolean).length > 0) && (
                          <div className="grid grid-cols-4 gap-2 mt-2">
                            {v.images.filter(Boolean).map((img, ii) => (
                              <div key={ii} className="relative group aspect-square">
                                <img src={img} alt="" className="w-full h-full object-cover rounded-lg border border-border/40" />
                                {ii === 0 && (
                                  <span className="absolute top-0.5 left-0.5 bg-black/70 text-white text-[8px] px-1 py-0.5 rounded font-bold tracking-wide">COVER</span>
                                )}
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    const nv = [...modalVariants];
                                    const imgs = (nv[idx].images || []).filter(Boolean).filter((_, fi) => fi !== ii);
                                    nv[idx].images = imgs;
                                    nv[idx].image = imgs[0] || '';
                                    setModalVariants(nv);
                                  }}
                                  className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full bg-red-500 text-white text-[10px] opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center leading-none shadow"
                                >×</button>
                                {ii > 0 && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      const nv = [...modalVariants];
                                      const clean = (nv[idx].images || []).filter(Boolean);
                                      nv[idx].images = [clean[ii], ...clean.filter((_, fi) => fi !== ii)];
                                      nv[idx].image = nv[idx].images![0];
                                      setModalVariants(nv);
                                    }}
                                    className="absolute bottom-0.5 left-0.5 right-0.5 bg-black/60 text-white text-[7px] text-center py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity font-medium"
                                  >Set Cover</button>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Variant Name <span className="text-destructive">*</span></label>
                          <input value={v.variant_name || ""} onChange={(e) => {
                            const newVars = [...modalVariants]; newVars[idx].variant_name = e.target.value; setModalVariants(newVars);
                          }} className="w-full px-3 py-2.5 rounded-lg bg-background border border-border text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all" placeholder="e.g., 500g Jar" />
                        </div>
                        <div>
                          <label className="text-xs font-medium text-muted-foreground mb-1.5 block">SKU <span className="text-destructive">*</span></label>
                          <input value={v.sku || ""} onChange={(e) => {
                            const newVars = [...modalVariants]; newVars[idx].sku = e.target.value; setModalVariants(newVars);
                          }} className="w-full px-3 py-2.5 rounded-lg bg-background border border-border text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all" placeholder="e.g., HON-500" />
                        </div>
                      </div>
                      <div className="grid grid-cols-4 gap-3">
                        <div>
                          <label className="text-xs font-medium text-muted-foreground mb-1.5 block">MRP (₹) <span className="text-destructive">*</span></label>
                          <input type="number" value={v.mrp ?? ""} onChange={(e) => {
                            const mrp = Number(e.target.value);
                            const nv = [...modalVariants];
                            nv[idx].mrp = mrp;
                            // Auto-calc price from MRP + discount
                            if (nv[idx].discount != null && nv[idx].discount! > 0) {
                              nv[idx].price = Math.round(mrp * (1 - nv[idx].discount! / 100));
                            }
                            setModalVariants(nv);
                          }} className="w-full px-3 py-2.5 rounded-lg bg-background border border-border text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all" placeholder="850" />
                        </div>
                        <div>
                          <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Discount % <span className="text-destructive">*</span></label>
                          <input type="number" min="0" max="100" value={v.discount ?? ""} onChange={(e) => {
                            const disc = Math.max(0, Number(e.target.value));
                            const nv = [...modalVariants];
                            nv[idx].discount = disc;
                            // Auto-calc price from MRP + discount
                            if (nv[idx].mrp != null && nv[idx].mrp! > 0) {
                              nv[idx].price = Math.round(nv[idx].mrp! * (1 - disc / 100));
                            }
                            setModalVariants(nv);
                          }} className="w-full px-3 py-2.5 rounded-lg bg-background border border-border text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all" placeholder="12" />
                        </div>
                        <div>
                          <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                            Price (₹) <span className="text-destructive">*</span>
                            {v.mrp != null && v.discount != null && v.discount > 0 && (
                              <span className="ml-1 text-primary font-semibold">auto</span>
                            )}
                          </label>
                          <input type="number" min="0" value={v.price ?? ""} onChange={(e) => {
                            const price = Number(e.target.value);
                            const nv = [...modalVariants];
                            nv[idx].price = price;
                            // Auto-calc discount from MRP + price (clamped to 0)
                            if (nv[idx].mrp != null && nv[idx].mrp! > 0 && price > 0) {
                              nv[idx].discount = Math.max(0, Math.round((1 - price / nv[idx].mrp!) * 100));
                            }
                            setModalVariants(nv);
                          }} className="w-full px-3 py-2.5 rounded-lg bg-background border border-border text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all" placeholder="749" />
                        </div>
                        <div>
                          <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Stock <span className="text-destructive">*</span></label>
                          <input type="number" value={v.stock_quantity ?? ""} onChange={(e) => {
                            const nv = [...modalVariants]; nv[idx].stock_quantity = Number(e.target.value); setModalVariants(nv);
                          }} className="w-full px-3 py-2.5 rounded-lg bg-background border border-border text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all" placeholder="80" />
                        </div>
                        <div>
                          <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Status</label>
                          <div className="flex items-center h-[42px]">
                            <button
                              onClick={(e) => {
                                e.preventDefault();
                                const nv = [...modalVariants]; nv[idx].is_active = !(nv[idx].is_active !== false); setModalVariants(nv);
                              }}
                              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${v.is_active !== false ? 'bg-primary' : 'bg-muted-foreground/30'}`}
                            >
                              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${v.is_active !== false ? 'translate-x-6' : 'translate-x-1'}`} />
                            </button>
                            <span className="ml-2 text-xs font-medium text-foreground">{v.is_active !== false ? 'Active' : 'Inactive'}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                  {/* + Add Variant button below last variant */}
                  <button
                    onClick={addVariantRow}
                    className="w-full mt-2 py-3 rounded-xl border-2 border-dashed border-primary/30 text-primary hover:border-primary/60 hover:bg-primary/5 transition-all text-sm font-semibold flex items-center justify-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Add Another Variant
                  </button>
                </div>
              </div>
            </div>
            <div className="flex gap-4 mt-8 pt-6 border-t border-border/50">
              <button disabled={isSaving} onClick={() => setShowModal(false)} className="flex-1 px-6 py-3 rounded-xl border-2 border-border text-sm font-semibold text-foreground hover:bg-muted transition-all disabled:opacity-50">Cancel</button>
              <motion.button 
                disabled={
                  isSaving ||
                  !formName.trim() ||
                  !formDescription.trim() ||
                  !selectedCategory ||
                  modalProductImages.filter(Boolean).length === 0 ||
                  modalVariants.some((v) => 
                    !v.variant_name?.trim() || 
                    !v.sku?.trim() || 
                    v.mrp === undefined || v.mrp === "" || 
                    v.price === undefined || v.price === "" || 
                    v.stock_quantity === undefined || v.stock_quantity === "" ||
                    (!v.images || v.images.filter(Boolean).length === 0)
                  )
                } 
                whileTap={isSaving ? {} : { scale: 0.99 }} onClick={handleSaveProduct} className="flex-1 px-6 py-3 rounded-xl gradient-green text-primary-foreground text-sm font-bold green-glow-sm shadow-lg disabled:opacity-50 disabled:cursor-not-allowed">
                {isSaving ? "Saving..." : selectedProduct ? "Save Changes" : "Create Product"}
              </motion.button>
            </div>
          </motion.div >
        </motion.div >
      )
      }

      {/* Edit Variant Modal */}
      {
        showEditVariantModal && selectedVariant && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 z-[110] flex items-center justify-center">
            <div className="absolute inset-0 bg-foreground/20 backdrop-blur-sm" onClick={() => setShowEditVariantModal(false)} />
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="glass-strong shadow-elevated rounded-2xl p-6 w-full max-w-lg relative z-20 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-bold text-foreground">Edit Variant</h3>
                  <p className="text-sm text-muted-foreground">{selectedVariant.variant_name}</p>
                </div>
                <button onClick={() => setShowEditVariantModal(false)} className="p-2 hover:bg-muted rounded-full transition-colors"><X className="w-5 h-5" /></button>
              </div>

              <div className="space-y-4">
                {/* Variant Name & SKU */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Variant Name <span className="text-destructive">*</span></label>
                    <input
                      type="text"
                      value={editVariantName}
                      onChange={(e) => setEditVariantName(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl bg-muted/50 border border-border text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/30"
                      placeholder="e.g., 500g Jar"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1.5 block">SKU <span className="text-destructive">*</span></label>
                    <input
                      type="text"
                      value={editSku}
                      onChange={(e) => setEditSku(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl bg-muted/50 border border-border text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/30"
                      placeholder="e.g., HON-500"
                    />
                  </div>
                </div>

                {/* MRP, Discount%, Price (auto-calc) */}
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1.5 block">MRP (₹) <span className="text-destructive">*</span></label>
                    <input
                      type="number"
                      value={editMrp}
                      onChange={(e) => {
                        const mrp = Number(e.target.value);
                        setEditMrp(e.target.value);
                        if (mrp > 0 && editDiscount) {
                          setEditPrice(String(Math.round(mrp * (1 - Number(editDiscount) / 100))));
                        }
                      }}
                      className="w-full px-4 py-2.5 rounded-xl bg-muted/50 border border-border text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/30"
                      placeholder="850"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Discount % <span className="text-destructive">*</span></label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={editDiscount}
                      onChange={(e) => {
                        const disc = Math.max(0, Number(e.target.value));
                        setEditDiscount(String(disc));
                        if (editMrp && Number(editMrp) > 0) {
                          setEditPrice(String(Math.round(Number(editMrp) * (1 - disc / 100))));
                        }
                      }}
                      className="w-full px-4 py-2.5 rounded-xl bg-muted/50 border border-border text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/30"
                      placeholder="12"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                      Price (₹) <span className="text-destructive">*</span>
                      {editMrp && editDiscount && Number(editDiscount) > 0 && (
                        <span className="ml-1 text-primary font-semibold">auto</span>
                      )}
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={editPrice}
                      onChange={(e) => {
                        setEditPrice(e.target.value);
                        if (editMrp && Number(editMrp) > 0 && Number(e.target.value) > 0) {
                          // Clamp discount to 0 if price > MRP
                          setEditDiscount(String(Math.max(0, Math.round((1 - Number(e.target.value) / Number(editMrp)) * 100))));
                        }
                      }}
                      className="w-full px-4 py-2.5 rounded-xl bg-muted/50 border border-border text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/30"
                      placeholder="749"
                    />
                  </div>
                </div>

                {/* Stock + Status */}
                <div className="flex gap-4">
                  <div className="flex-1">
                    <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Stock <span className="text-destructive">*</span></label>
                    <input
                      type="number"
                      value={editStock}
                      onChange={(e) => setEditStock(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl bg-muted/50 border border-border text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/30"
                      placeholder="Enter stock"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Status</label>
                    <div className="flex items-center h-[42px] gap-2">
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          if (editIsActive) {
                            setDeactivateDialog({
                              message: "Are you sure you want to deactivate this variant?",
                              onConfirm: () => setEditIsActive(false),
                            });
                            return;
                          }
                          setEditIsActive(!editIsActive);
                        }}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${editIsActive ? 'bg-primary' : 'bg-muted-foreground/30'}`}
                      >
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${editIsActive ? 'translate-x-6' : 'translate-x-1'}`} />
                      </button>
                      <span className="text-xs font-medium text-foreground">{editIsActive ? 'Active' : 'Inactive'}</span>
                    </div>
                  </div>
                </div>

                {/* Images */}
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Images</label>
                  <div className="grid grid-cols-4 gap-2 mb-3">
                    {editImages.map((img, ii) => (
                      <div key={ii} className="relative group aspect-square">
                        <img src={img} alt="" className="w-full h-full object-cover rounded-lg border border-border/40" />
                        {ii === 0 && (
                          <span className="absolute top-0.5 left-0.5 bg-black/70 text-white text-[8px] px-1 py-0.5 rounded font-bold tracking-wide">COVER</span>
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditImages(editImages.filter((_, fi) => fi !== ii));
                          }}
                          className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full bg-red-500 text-white text-[10px] opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center leading-none shadow"
                        >×</button>
                        {ii > 0 && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              const newImgs = [...editImages];
                              newImgs.splice(ii, 1);
                              newImgs.unshift(img);
                              setEditImages(newImgs);
                            }}
                            className="absolute bottom-0.5 left-0.5 right-0.5 bg-black/60 text-white text-[7px] text-center py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity font-medium"
                          >Set Cover</button>
                        )}
                      </div>
                    ))}
                    {/* Upload tile */}
                    <div
                      onDragOver={(e) => { e.preventDefault(); setEditDragOver(true); }}
                      onDragLeave={() => setEditDragOver(false)}
                      onDrop={(e) => {
                        e.preventDefault();
                        setEditDragOver(false);
                        const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'));
                        if (files.length) {
                          const newUrls = files.map(f => URL.createObjectURL(f));
                          setEditImages([...editImages, ...newUrls]);
                        }
                      }}
                      onClick={() => {
                        const inp = document.getElementById(`edit-variant-img-input`) as HTMLInputElement;
                        inp?.click();
                      }}
                      className={`cursor-pointer aspect-square rounded-lg border-2 border-dashed transition-all duration-200 flex flex-col items-center justify-center p-2 text-center ${editDragOver ? 'border-primary bg-primary/5' : 'border-border/60 bg-muted/20 hover:border-primary/50 hover:bg-muted/30'}`}
                    >
                      <ImagePlus className={`w-4 h-4 mb-1 transition-colors ${editDragOver ? 'text-primary' : 'text-muted-foreground'}`} />
                      <span className="text-[9px] font-medium text-foreground">
                        {editDragOver ? 'Drop files here' : 'Add Images'}
                      </span>
                      <input
                        id="edit-variant-img-input"
                        type="file"
                        className="hidden"
                        accept="image/*"
                        multiple
                        onChange={(e) => {
                          if (e.target.files) {
                            const newUrls = Array.from(e.target.files).map(f => URL.createObjectURL(f));
                            setEditImages([...editImages, ...newUrls]);
                            e.target.value = '';
                          }
                        }}
                      />
                    </div>
                  </div>
                </div>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    if (selectedVariant) {
                      const updatedProducts = products.map(p => ({
                        ...p,
                        variants: p.variants.map(v =>
                          v.id === selectedVariant.id
                            ? {
                                ...v,
                                variant_name: editVariantName || v.variant_name,
                                sku: editSku || v.sku,
                                mrp: editMrp ? Number(editMrp) : v.mrp,
                                discount: editDiscount ? Number(editDiscount) : v.discount,
                                price: Number(editPrice),
                                stock_quantity: Number(editStock),
                                images: editImages,
                                image: editImages[0] || "",
                                is_active: editIsActive,
                              }
                            : v
                        )
                      }));
                      setProducts(updatedProducts);
                      setShowEditVariantModal(false);
                    }
                  }}
                  className="w-full mt-2 px-4 py-3 rounded-xl gradient-green text-primary-foreground font-semibold text-sm green-glow-sm shadow-lg flex items-center justify-center gap-2"
                >
                  <Save className="w-4 h-4" /> Save Changes
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )
      }

      {/* Image Lightbox */}
      <AnimatePresence>
        {lightboxImages.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex items-center justify-center"
            onClick={() => setLightboxImages([])}
          >
            <div className="absolute inset-0 bg-black/80 backdrop-blur-md" />
            <motion.div
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", damping: 22 }}
              className="relative z-10 flex flex-col items-center gap-4 max-w-[95vw] max-h-[95vh]"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between w-full px-1">
                <span className="text-white font-semibold text-sm">
                  {lightboxLabel} {lightboxImages.length > 1 && <span className="text-white/70 ml-2">({lightboxIndex + 1} / {lightboxImages.length})</span>}
                </span>
                <button
                  onClick={() => setLightboxImages([])}
                  className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
                >
                  <X className="w-4 h-4 text-white" />
                </button>
              </div>
              <div className="relative flex items-center justify-center group">
                {lightboxImages.length > 1 && (
                  <button
                    onClick={(e) => { e.stopPropagation(); setLightboxIndex(prev => (prev > 0 ? prev - 1 : lightboxImages.length - 1)); }}
                    className="absolute left-4 p-3 rounded-full bg-black/40 hover:bg-black/70 text-white backdrop-blur-sm transition-all opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 cursor-pointer"
                  >
                    <ChevronLeft className="w-6 h-6" />
                  </button>
                )}
                <img
                  src={lightboxImages[lightboxIndex]}
                  alt={lightboxLabel}
                  className="max-w-[90vw] max-h-[85vh] rounded-2xl object-contain shadow-2xl"
                />
                {lightboxImages.length > 1 && (
                  <button
                    onClick={(e) => { e.stopPropagation(); setLightboxIndex(prev => (prev < lightboxImages.length - 1 ? prev + 1 : 0)); }}
                    className="absolute right-4 p-3 rounded-full bg-black/40 hover:bg-black/70 text-white backdrop-blur-sm transition-all opacity-0 group-hover:opacity-100 translate-x-2 group-hover:translate-x-0 cursor-pointer"
                  >
                    <ChevronRight className="w-6 h-6" />
                  </button>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AlertDialog open={!!deactivateDialog} onOpenChange={v => { if (!v) setDeactivateDialog(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Deactivate</AlertDialogTitle>
            <AlertDialogDescription>{deactivateDialog?.message}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                deactivateDialog?.onConfirm();
                setDeactivateDialog(null);
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Deactivate
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout >
  );
};

export default Products;
