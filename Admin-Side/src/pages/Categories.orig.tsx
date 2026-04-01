import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { SearchFilter } from "@/components/shared/SearchFilter";
import { GlassCard } from "@/components/shared/GlassCard";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { motion } from "framer-motion";
import { Plus, Edit2, Search, LayoutGrid, Package, ShoppingCart } from "lucide-react";
import React, { useState } from "react";
import { useToast } from "@/hooks/use-toast";

// ...existing code...
import { categories as mockCategories, mockProducts } from "@/data/mockData";
import { Link, useNavigate } from "react-router-dom";
import { getCategories, createCategory } from "@/lib/api";
import { useEffect } from "react";

const Categories = () => {
  const { toast } = useToast();
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [categoriesList, setCategoriesList] = useState<Category[]>(mockCategories);

  useEffect(() => {
    const fetchCats = async () => {
      try {
        const res: any = await getCategories();
        if (res.success && Array.isArray(res.data)) {
          setCategoriesList(res.data);
        } else if (Array.isArray(res)) {
          setCategoriesList(res);
        } else if (res.categories && Array.isArray(res.categories)) {
          setCategoriesList(res.categories);
        }
      } catch (err) {
        console.error("Failed to fetch categories:", err);
      }
    };
    fetchCats();
  }, []);

  // Form state
  const [formName, setFormName] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formIsActive, setFormIsActive] = useState(true);

  const handleEditCategory = (e: React.MouseEvent, category: Category) => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedCategory(category);
    setFormName(category.name);
    setFormDescription(category.description);
    setFormIsActive(category.is_active);
    setShowModal(true);
  };

  const handleAddCategory = () => {
    setShowModal(true);
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

    if (selectedCategory) {
<<<<<<< HEAD
      setLoading(true);
      editCategory({
        id: selectedCategory.id,
        name: formName,
        description: formDescription,
        is_active: formIsActive
      })
        .then(res => {
          if (res.success && res.data) {
            setCategoriesList(prev => prev.map(cat => cat.id === selectedCategory.id ? res.data[0] : cat));
            toast({ title: "Success", description: `Category "${formName}" updated successfully!` });
          } else {
            toast({ title: "Error", description: res.message || "Failed to update category.", variant: "destructive" });
          }
        })
        .catch(() => {
          toast({ title: "Error", description: "Failed to update category.", variant: "destructive" });
        })
        .finally(() => {
          setLoading(false);
        });
        if (selectedCategory) {
          // Edit existing category
          setCategoriesList(categoriesList.map(cat =>
            cat.id === selectedCategory.id
              ? { ...cat, name: formName, description: formDescription, is_active: formIsActive }
              : cat
          ));
          toast({
            title: "Success",
            description: `Category "${formName}" has been updated successfully!`,
          });
          setShowModal(false);
          setSelectedCategory(null);
        } else {
          // Add new category
          const payload = {
            name: formName,
            description: formDescription,
            is_active: formIsActive,
          };
          try {
            const res: any = await createCategory(payload);
            if (res.success || res.id) {
              const newCategory: Category = {
                id: res.data?.id || res.id || Math.max(0, ...categoriesList.map(c => c.id)) + 1,
                name: formName,
                description: formDescription,
                is_active: formIsActive,
                created_at: new Date().toLocaleDateString()
              };
              setCategoriesList([...categoriesList, newCategory]);
              toast({
                title: "Success",
                description: `Category "${formName}" has been created successfully!`,
              });
              setShowModal(false);
              setSelectedCategory(null);
            } else {
              toast({ title: "Error", description: res.message || "Failed to create category", variant: "destructive" });
            }
          } catch (e: any) {
            toast({ title: "Error", description: e.message || "Network error", variant: "destructive" });
          }
        }
    const categoryProducts = mockProducts.filter(p => p.category === c.name);
    const hasMatchingProduct = categoryProducts.some(p => {
      // Check Product Name
      const productText = p.name.toLowerCase();
      if (searchTokens.every(token => productText.includes(token))) return true;

      // Check Variants
      return p.variants.some(v => {
        const fullText = `${p.name} ${p.description} ${v.variant_name} ${v.sku}`.toLowerCase();
        return searchTokens.every(token => fullText.includes(token));
      });
    });

    const matchesSearch = hasMatchingProduct;

    if (filterStatus === "Active") return matchesSearch && c.is_active;
    if (filterStatus === "Inactive") return matchesSearch && !c.is_active;
    return matchesSearch;
  });

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6; // Adjusted for grid view

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const paginatedCategories = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handlePageChange = (newPage: number) => {
    if (newPage > 0 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  return (
    <DashboardLayout>
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
          placeholder="Search categories..."
        />
      </div>

      {/* Categories Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {paginatedCategories.map((cat) => (
          <Link to={`/category/${cat.name}`} key={cat.id} className="block group">
            <GlassCard className="p-0 overflow-hidden hover:scale-[1.02] transition-transform duration-300 relative h-full flex flex-col justify-between">
              <div className="p-5 flex-1">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <h3 className="text-xl font-bold text-foreground">{cat.name}</h3>
                    <StatusBadge status={cat.is_active ? "Active" : "Inactive"} variant={cat.is_active ? "green" : "gray"} />
                  </div>
                </div>
                <p className="text-sm text-muted-foreground line-clamp-3">{cat.description}</p>
                {searchTerm && (
                  <div className="mt-4 space-y-2">
                    {mockProducts
                      .filter(p => p.category === cat.name)
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
                          <div className="text-muted-foreground text-[10px] mt-1">
                            {p.variants.filter(v => {
                              const searchTokens = searchTerm.toLowerCase().split(' ').filter(token => token.length > 0);
                              if (searchTokens.length === 0) return false;

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
                  <span>Created: {cat.created_at}</span>
                  <button className="p-2 hover:bg-accent rounded-full transition-colors text-foreground" onClick={(e) => handleEditCategory(e, cat)}>
                    <Edit2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </GlassCard>
          </Link>
        ))}
      </div>

      {/* Pagination */}
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
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 z-[100] flex items-center justify-center">
          <div className="absolute inset-0 bg-foreground/20 backdrop-blur-sm" onClick={() => setShowModal(false)} />
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="glass-strong shadow-elevated rounded-2xl p-6 w-full max-w-md relative z-10 mx-4">
            <h2 className="text-lg font-bold text-foreground mb-5">{selectedCategory ? "Edit Category" : "Add Category"}</h2>
            <div className="space-y-4">
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
                      onChange={(e) => setFormIsActive(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                  </div>
                  <span>Active Status</span>
                </label>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowModal(false)} className="flex-1 px-4 py-2.5 rounded-xl border border-border text-sm font-medium text-foreground hover:bg-muted transition-colors">Cancel</button>
              <motion.button whileTap={{ scale: 0.99 }} onClick={handleSaveCategory} className="flex-1 px-4 py-2.5 rounded-xl gradient-green text-primary-foreground text-sm font-semibold green-glow-sm">{selectedCategory ? "Save Changes" : "Save Category"}</motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </DashboardLayout>
  );
};

export default Categories;
