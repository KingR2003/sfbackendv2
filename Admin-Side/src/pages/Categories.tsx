import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { SearchFilter } from "@/components/shared/SearchFilter";
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
import { motion } from "framer-motion";
import { Plus, Edit2, Boxes, CheckCircle2, CircleOff, ArrowRight, Upload, X } from "lucide-react";
import React, { useState, useEffect, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import { Category, Product } from "@/data/mockData";
import { Link } from "react-router-dom";
import { getCategories, createCategory, updateCategory, getProducts } from "@/lib/api";

function isCategoryActive(category: any): boolean {
  const raw = category?.is_active ?? category?.isActive ?? category?.active ?? category?.status;
  if (typeof raw === "boolean") return raw;
  if (typeof raw === "number") return raw === 1;
  if (typeof raw === "string") {
    const value = raw.trim().toLowerCase();
    if (value === "true" || value === "1" || value === "active") return true;
    if (value === "false" || value === "0" || value === "inactive") return false;
  }
  return true;
}

const Categories = () => {
  const { toast } = useToast();
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<"All" | "Active" | "Inactive">("All");
  const [sortBy, setSortBy] = useState<"Newest" | "Oldest" | "AZ" | "ZA">("Newest");
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [categoriesList, setCategoriesList] = useState<Category[]>([]);
  const [productsList, setProductsList] = useState<Product[]>([]);
  const [isLoadingList, setIsLoadingList] = useState(false);

  // Form state
  const [formName, setFormName] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formIsActive, setFormIsActive] = useState(true);
  const [formImageFile, setFormImageFile] = useState<File | null>(null);
  const [formImagePreview, setFormImagePreview] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isStatusSyncing, setIsStatusSyncing] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const [pendingStatusChange, setPendingStatusChange] = useState<{
    category: Category;
    nextStatus: boolean;
  } | null>(null);

  const normalizeCategory = (c: any): Category => ({
    id: c.id,
    name: c.name,
    description: c.description || "",
    image: c.image || c.imageUrl || c.image_url || c.categoryImage || "",
    is_active: isCategoryActive(c),
    created_at: c.created_at ?? c.createdAt ?? "",
  });

  const resetCategoryForm = () => {
    setSelectedCategory(null);
    setFormName("");
    setFormDescription("");
    setFormIsActive(true);
    setFormImageFile(null);
    setFormImagePreview("");
    if (imageInputRef.current) {
      imageInputRef.current.value = "";
    }
  };

  const handleCategoryImageChange = (file: File | null) => {
    setFormImageFile(file);
    if (!file) {
      if (imageInputRef.current) {
        imageInputRef.current.value = "";
      }
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setFormImagePreview(String(event.target?.result ?? ""));
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveCategoryImage = () => {
    setFormImageFile(null);
    setFormImagePreview("");
    if (imageInputRef.current) {
      imageInputRef.current.value = "";
    }
  };

  const normalizeText = (value: unknown) => String(value ?? "").trim().toLowerCase();
  const doesProductBelongToCategory = (product: Product, category: Category) => {
    if (product.category_id != null && category.id != null) {
      return Number(product.category_id) === Number(category.id);
    }
    return normalizeText(product.category) === normalizeText(category.name);
  };

  const getCategoryProductIds = (category: Category): Array<number | string> => {
    return productsList
      .filter((product) => doesProductBelongToCategory(product, category))
      .map((product) => product.id);
  };

  const fetchCategoriesList = async () => {
    const res: any = await getCategories();
    const categories =
      Array.isArray(res) ? res :
      Array.isArray(res?.data) ? res.data :
      Array.isArray(res?.categories) ? res.categories :
      Array.isArray(res?.content) ? res.content :
      Array.isArray(res?.data?.categories) ? res.data.categories :
      Array.isArray(res?.data?.content) ? res.data.content :
      [];
    setCategoriesList(categories.map(normalizeCategory));
  };

  useEffect(() => {
    const fetchData = async () => {
      setIsLoadingList(true);
      try {
        const [catsResult, productsResult] = await Promise.allSettled([fetchCategoriesList(), getProducts()]);

        if (catsResult.status === "rejected") {
          setCategoriesList([]);
          console.error("Failed to fetch categories:", catsResult.reason);
          toast({
            title: "Error",
            description: "Failed to load categories.",
            variant: "destructive",
          });
        }

        if (productsResult.status === "fulfilled") {
          const res: any = productsResult.value;
          const products =
            Array.isArray(res) ? res :
            Array.isArray(res?.data) ? res.data :
            Array.isArray(res?.products) ? res.products :
            Array.isArray(res?.content) ? res.content :
            Array.isArray(res?.data?.products) ? res.data.products :
            Array.isArray(res?.data?.content) ? res.data.content :
            [];
          setProductsList(products);
        } else {
          setProductsList([]);
          console.error("Failed to fetch products:", productsResult.reason);
        }
      } catch (err) {
        console.error("Failed to fetch categories/products:", err);
      } finally {
        setIsLoadingList(false);
      }
    };
    fetchData();
  }, []);

  const handleEditCategory = (e: React.MouseEvent, category: Category) => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedCategory(category);
    setFormName(category.name);
    setFormDescription(category.description || "");
    setFormIsActive(category.is_active ?? true);
    setFormImageFile(null);
    setFormImagePreview(category.image || "");
    if (imageInputRef.current) {
      imageInputRef.current.value = "";
    }
    setShowModal(true);
  };

  const handleAddCategory = () => {
    resetCategoryForm();
    setShowModal(true);
  };

  const handleCategoryStatusToggleRequest = (nextStatus: boolean) => {
    if (!selectedCategory || isStatusSyncing) return;
    if ((selectedCategory.is_active ?? true) === nextStatus) {
      setFormIsActive(nextStatus);
      return;
    }
    setPendingStatusChange({ category: selectedCategory, nextStatus });
  };

  const handleConfirmCategoryStatusChange = async () => {
    if (!pendingStatusChange) return;

    const { category, nextStatus } = pendingStatusChange;

    setIsStatusSyncing(true);
    try {
      await updateCategory(category.id, {
        name: category.name,
        description: category.description || "",
        isActive: nextStatus,
      });

      setCategoriesList((prev) =>
        prev.map((cat) =>
          Number(cat.id) === Number(category.id)
            ? { ...cat, is_active: nextStatus }
            : cat
        )
      );

      setProductsList((prev) =>
        prev.map((product) =>
          doesProductBelongToCategory(product, category)
            ? { ...product, is_active: nextStatus }
            : product
        )
      );

      setSelectedCategory((prev) =>
        prev && Number(prev.id) === Number(category.id)
          ? { ...prev, is_active: nextStatus }
          : prev
      );
      setFormIsActive(nextStatus);

      toast({
        title: "Success",
        description: "Category and all products updated successfully.",
      });
    } catch (e: any) {
      toast({
        title: "Error",
        description: e?.message || "Failed to update category and product statuses.",
        variant: "destructive",
      });
      setFormIsActive(selectedCategory?.is_active ?? true);
    } finally {
      setPendingStatusChange(null);
      setIsStatusSyncing(false);
    }
  };

  const handleSaveCategory = async () => {
    if (!formName.trim()) {
      toast({
        title: "Error",
        description: "Category name is required!",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    try {
      if (selectedCategory) {
        const payload = {
          name: formName,
          description: formDescription,
          isActive: formIsActive,
        };
        await updateCategory(selectedCategory.id, payload, formImageFile);
        await fetchCategoriesList();
        toast({
          title: "Success",
          description: `Category "${formName}" updated successfully!`,
        });
        setShowModal(false);
        setSelectedCategory(null);
      } else {
        // Add new category
        const payload = {
          name: formName,
          description: formDescription,
          isActive: formIsActive,
        };
        const res: any = await createCategory(payload, formImageFile);
        
        if (res.success || res.id) {
          await fetchCategoriesList();
          toast({
            title: "Success",
            description: `Category "${formName}" has been created successfully!`,
          });
          setShowModal(false);
          setSelectedCategory(null);
        } else {
          toast({ title: "Error", description: res.message || "Failed to create category", variant: "destructive" });
        }
      }
    } catch (e: any) {
      toast({ title: "Error", description: e.message || "Network error", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  // Filtering
  const filtered = categoriesList.filter(c => {
    const searchTokens = searchTerm.toLowerCase().split(' ').filter(token => token.length > 0);
    
    // Check if category name/description matches
    const catMatches = searchTokens.length === 0 || searchTokens.every(token => 
      c.name.toLowerCase().includes(token) || (c.description?.toLowerCase().includes(token))
    );

    // Check if inner products/variants match
    const categoryProducts = productsList.filter(p => doesProductBelongToCategory(p, c));
    const hasMatchingProduct = categoryProducts.some(p => {
      if (searchTokens.length === 0) return true;
      const productText = p.name.toLowerCase();
      if (searchTokens.every(token => productText.includes(token))) return true;

      return p.variants.some(v => {
        const fullText = `${p.name} ${p.description} ${v.variant_name} ${v.sku}`.toLowerCase();
        return searchTokens.every(token => fullText.includes(token));
      });
    });

    const matchesSearch = catMatches || hasMatchingProduct;

    if (filterStatus === "Active") return matchesSearch && c.is_active;
    if (filterStatus === "Inactive") return matchesSearch && !c.is_active;
    return matchesSearch;
  }).sort((a, b) => {
    if (sortBy === "AZ") return a.name.localeCompare(b.name);
    if (sortBy === "ZA") return b.name.localeCompare(a.name);
    if (sortBy === "Oldest") return Number(a.id) - Number(b.id);
    return Number(b.id) - Number(a.id); // Newest
  });

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const totalPages = Math.ceil(filtered.length / itemsPerPage) || 1;
  
  // Ensure we don't end up on an empty page after filtering
  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(1);
    }
  }, [totalPages, currentPage]);

  const paginatedCategories = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const productCountByCategory = categoriesList.reduce<Record<number, number>>((acc, category) => {
    acc[Number(category.id)] = productsList.filter(product => doesProductBelongToCategory(product, category)).length;
    return acc;
  }, {});

  const totalCategories = categoriesList.length;
  const activeCategoriesCount = categoriesList.filter((cat) => cat.is_active).length;
  const inactiveCategoriesCount = totalCategories - activeCategoriesCount;
  const totalProductsAcrossCategories = Object.values(productCountByCategory).reduce((sum, count) => sum + count, 0);

  const handlePageChange = (newPage: number) => {
    if (newPage > 0 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  return (
    <DashboardLayout>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 mb-5">
        <GlassCard
          className={`p-4 cursor-pointer transition-all duration-300 ${filterStatus === "All" ? "ring-2 ring-primary/40" : "hover:shadow-lg"}`}
          onClick={() => setFilterStatus("All")}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">All Categories</p>
              <p className="text-2xl font-bold text-foreground mt-1">{totalCategories}</p>
              <p className="text-[11px] text-muted-foreground mt-1">Products mapped: {totalProductsAcrossCategories}</p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center">
              <Boxes className="w-5 h-5 text-primary" />
            </div>
          </div>
        </GlassCard>

        <GlassCard
          className={`p-4 cursor-pointer transition-all duration-300 ${filterStatus === "Active" ? "ring-2 ring-green-500/40" : "hover:shadow-lg"}`}
          onClick={() => setFilterStatus("Active")}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Active Categories</p>
              <p className="text-2xl font-bold text-foreground mt-1">{activeCategoriesCount}</p>
              <p className="text-[11px] text-muted-foreground mt-1">Tap to filter active only</p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-green-500/10 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
            </div>
          </div>
        </GlassCard>

        <GlassCard
          className={`p-4 cursor-pointer transition-all duration-300 ${filterStatus === "Inactive" ? "ring-2 ring-orange-500/40" : "hover:shadow-lg"}`}
          onClick={() => setFilterStatus("Inactive")}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Inactive Categories</p>
              <p className="text-2xl font-bold text-foreground mt-1">{inactiveCategoriesCount}</p>
              <p className="text-[11px] text-muted-foreground mt-1">Tap to filter inactive only</p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-orange-500/10 flex items-center justify-center">
              <CircleOff className="w-5 h-5 text-orange-500" />
            </div>
          </div>
        </GlassCard>
      </div>

      {/* Header and Filters */}
      <div className="mb-8 mt-4">
        <SearchFilter
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          filterValue={filterStatus}
          setFilterValue={(val) => setFilterStatus(val as "All" | "Active" | "Inactive")}
          filterOptions={[
            { label: "All Categories", value: "All" },
            { label: "Active", value: "Active" },
            { label: "Inactive", value: "Inactive" }
          ]}
          sortValue={sortBy}
          setSortValue={(val) => { setSortBy(val as any); setCurrentPage(1); }}
          sortOptions={[
            { label: "Newest First", value: "Newest" },
            { label: "Oldest First", value: "Oldest" },
            { label: "Name A–Z", value: "AZ" },
            { label: "Name Z–A", value: "ZA" },
          ]}
          placeholder="Search categories or products..."
        />
      </div>

      {isLoadingList ? (
        <div className="flex items-center justify-center p-12">
            <div className="w-8 h-8 rounded-full border-4 border-primary/30 border-t-primary animate-spin" />
        </div>
      ) : (
        <>
            {/* Categories Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                {paginatedCategories.map((cat) => (
                <Link to={`/category/${cat.name}`} key={cat.id} className="block group">
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.25 }}
                    >
                    <GlassCard className="p-0 overflow-hidden hover:scale-[1.02] transition-all duration-300 relative h-full flex flex-col justify-between border border-border/70 group-hover:border-primary/40">
                    {cat.image ? (
                      <div className="h-40 w-full overflow-hidden bg-muted/30">
                        <img src={cat.image} alt={cat.name} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]" />
                      </div>
                    ) : (
                      <div className="h-40 w-full bg-gradient-to-br from-primary/10 via-muted/40 to-muted/20 flex items-center justify-center">
                        <Boxes className="w-10 h-10 text-primary/60" />
                      </div>
                    )}
                    <div className={`h-1.5 w-full ${cat.is_active ? "bg-gradient-to-r from-green-500/70 to-primary/60" : "bg-gradient-to-r from-muted-foreground/40 to-muted-foreground/20"}`} />
                    <div className="p-5 flex-1">
                        <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center gap-3">
                            <h3 className="text-xl font-bold text-foreground">{cat.name}</h3>
                            <StatusBadge status={cat.is_active ? "Active" : "Inactive"} variant={cat.is_active ? "green" : "gray"} />
                        </div>
                        <span className="text-[10px] uppercase tracking-wide font-semibold text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                          View <ArrowRight className="inline w-3 h-3" />
                        </span>
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-3">{cat.description || "No description provided."}</p>
                        <div className="mt-3 inline-flex items-center px-2.5 py-1 rounded-full bg-muted/50 border border-border/60 text-xs font-medium text-muted-foreground">
                          Products: {productCountByCategory[Number(cat.id)] || 0}
                        </div>
                        
                        {searchTerm && (
                        <div className="mt-4 space-y-2">
                            {productsList
                            .filter(p => doesProductBelongToCategory(p, cat))
                            .filter(p => {
                                const searchTokens = searchTerm.toLowerCase().split(' ').filter(token => token.length > 0);
                                if (searchTokens.length === 0) return false;

                                const productText = p.name.toLowerCase();
                                return searchTokens.every(token => productText.includes(token)) ||
                                p.variants.some(v => {
                                    const fullText = `${p.name} ${p.description} ${v.variant_name} ${v.sku}`.toLowerCase();
                                    return searchTokens.every(token => fullText.includes(token));
                                });
                            })
                            .slice(0, 3)
                            .map(p => (
                                <div key={p.id} className="text-xs bg-muted/50 p-2 rounded-lg border border-border/50">
                                <div className="font-medium text-foreground">{p.name}</div>
                                <div className="text-muted-foreground text-[10px] mt-1 line-clamp-2">
                                    {p.variants.filter(v => {
                                    const searchTokens = searchTerm.toLowerCase().split(' ').filter(token => token.length > 0);
                                    if (searchTokens.length === 0) return true;

                                    const fullText = `${p.name} ${p.description} ${v.variant_name} ${v.sku}`.toLowerCase();
                                    return searchTokens.every(token => fullText.includes(token));
                                    }).map(v => v.variant_name).join(", ")}
                                </div>
                                </div>
                            ))}
                        </div>
                        )}
                    </div>
                    <div className="p-5 pt-0">
                        <div className="flex items-center justify-between text-xs text-muted-foreground border-t border-border/50 pt-4">
                        <span>Created: {cat.created_at || "N/A"}</span>
                      <button className="p-2 hover:bg-accent rounded-full transition-colors text-foreground" onClick={(e) => handleEditCategory(e, cat)}>
                            <Edit2 className="w-4 h-4" />
                        </button>
                        </div>
                    </div>
                    </GlassCard>
                    </motion.div>
                </Link>
                ))}
            </div>

            {filtered.length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                    No categories found matching your criteria.
                </div>
            )}

            {/* Pagination */}
            {filtered.length > itemsPerPage && (
                <div className="flex flex-col items-center justify-center gap-3 mb-8">
                    <div className="flex items-center gap-2">
                    <button onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1} className="px-3 py-1.5 rounded-lg hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed text-xs font-medium text-foreground">
                        Previous
                    </button>
                    <span className="text-xs font-medium text-foreground">Page {currentPage} of {totalPages}</span>
                    <button onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages} className="px-3 py-1.5 rounded-lg hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed text-xs font-medium text-foreground">
                        Next
                    </button>
                    </div>
                    <span className="text-xs text-muted-foreground">Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filtered.length)} of {filtered.length} entries</span>
                </div>
            )}
        </>
      )}

      {/* Floating Add Button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={handleAddCategory}
        className="fixed bottom-8 right-8 w-14 h-14 rounded-full gradient-green flex items-center justify-center text-primary-foreground shadow-lg green-glow-sm z-50"
      >
        <Plus className="w-6 h-6" />
      </motion.button>

      {/* Add/Edit Modal */}
      {showModal && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 z-40 flex items-center justify-center">
          <div className="absolute inset-0 bg-foreground/20 backdrop-blur-sm" onClick={() => setShowModal(false)} />
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="glass-strong shadow-elevated rounded-2xl p-6 w-full max-w-md relative z-10 mx-4">
            <h2 className="text-lg font-bold text-foreground mb-5">{selectedCategory ? "Edit Category" : "Add Category"}</h2>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Category Image</label>
                {formImagePreview ? (
                  <div className="relative mb-3 overflow-hidden rounded-xl border border-border bg-muted/40">
                    <img src={formImagePreview} alt="Category preview" className="h-44 w-full object-cover" />
                    <button
                      type="button"
                      onClick={handleRemoveCategoryImage}
                      className="absolute top-2 right-2 inline-flex h-8 w-8 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur-sm transition-colors hover:bg-black/80"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => imageInputRef.current?.click()}
                    className="mb-3 flex h-44 w-full flex-col items-center justify-center rounded-xl border-2 border-dashed border-border/70 bg-muted/30 text-center transition-colors hover:border-primary/60 hover:bg-primary/5"
                  >
                    <Upload className="mb-2 h-6 w-6 text-muted-foreground" />
                    <span className="text-sm font-medium text-foreground">Upload category image</span>
                    <span className="mt-1 text-[11px] text-muted-foreground">JPG, PNG or WebP</span>
                  </button>
                )}
                <input
                  ref={imageInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={(e) => handleCategoryImageChange(e.target.files?.[0] ?? null)}
                />
              </div>
              <div><label className="text-xs font-medium text-muted-foreground mb-1.5 block">Category Name</label>
                <input
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-muted/50 border border-border text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/30"
                  placeholder="Enter category name"
                /></div>
              <div><label className="text-xs font-medium text-muted-foreground mb-1.5 block">Description</label>
                <textarea
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-muted/50 border border-border text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/30 resize-none h-20"
                  placeholder="Category description"
                /></div>

              <div className="flex items-center justify-between pt-2">
                <label className="flex items-center gap-3 text-sm font-medium text-foreground cursor-pointer">
                  <div className="relative">
                    <input
                      type="checkbox"
                      checked={formIsActive}
                      onChange={(e) => {
                        if (selectedCategory) {
                          handleCategoryStatusToggleRequest(e.target.checked);
                          return;
                        }
                        setFormIsActive(e.target.checked);
                      }}
                      disabled={isStatusSyncing}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary peer-disabled:opacity-50"></div>
                  </div>
                  <span>{isStatusSyncing ? "Updating status..." : "Active Status"}</span>
                </label>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button 
                onClick={() => {
                  setShowModal(false);
                  resetCategoryForm();
                }} 
                disabled={isSaving || isStatusSyncing}
                className="flex-1 px-4 py-2.5 rounded-xl border border-border text-sm font-medium text-foreground hover:bg-muted transition-colors disabled:opacity-50">
                Cancel
              </button>
              <motion.button 
                whileTap={isSaving || isStatusSyncing ? {} : { scale: 0.99 }} 
                onClick={handleSaveCategory} 
                disabled={isSaving || isStatusSyncing}
                className="flex-1 px-4 py-2.5 rounded-xl gradient-green text-primary-foreground text-sm font-semibold green-glow-sm disabled:opacity-50 disabled:cursor-not-allowed">
                {isSaving ? "Saving..." : selectedCategory ? "Save Changes" : "Save Category"}
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}

      <AlertDialog open={!!pendingStatusChange} onOpenChange={(isOpen) => { if (!isOpen && !isStatusSyncing) setPendingStatusChange(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{pendingStatusChange?.nextStatus ? "Activate Category" : "Deactivate Category"}</AlertDialogTitle>
            <AlertDialogDescription>
              {pendingStatusChange?.nextStatus
                ? "Are you sure you want to activate this category and all its products?"
                : "Are you sure you want to deactivate this category and all its products?"}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isStatusSyncing}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmCategoryStatusChange}
              disabled={isStatusSyncing}
              className={pendingStatusChange?.nextStatus
                ? "disabled:opacity-50 disabled:pointer-events-none"
                : "bg-destructive text-destructive-foreground hover:bg-destructive/90 disabled:opacity-50 disabled:pointer-events-none"
              }
            >
              {isStatusSyncing
                ? "Processing..."
                : pendingStatusChange?.nextStatus
                  ? "Activate"
                  : "Deactivate"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
};

export default Categories;
