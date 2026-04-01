
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { GlassCard } from "@/components/shared/GlassCard";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { motion } from "framer-motion";
import { ChevronLeft } from "lucide-react";
import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { getProducts, getCategories } from "@/lib/api";
import type { Product } from "@/data/mockData";

const CategoryDetails = () => {
    const { category } = useParams<{ category: string }>();
    const [expandedProduct, setExpandedProduct] = useState<number | null>(null);
    const [categoryProducts, setCategoryProducts] = useState<Product[]>([]);
    const [currentCategory, setCurrentCategory] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [notFound, setNotFound] = useState(false);

    useEffect(() => {
        const load = async () => {
            try {
                setIsLoading(true);
                const [products, categoriesRaw] = await Promise.all([getProducts(), getCategories()]);

                // Normalize fetched categories
                const rawList: any[] = Array.isArray(categoriesRaw)
                    ? categoriesRaw
                    : (categoriesRaw as any)?.data ?? (categoriesRaw as any)?.categories ?? [];

                // Find matching category by name (case-insensitive)
                const matched = rawList.find(
                    (c: any) =>
                        (c.name ?? c.categoryName ?? "").toLowerCase() ===
                        (category ?? "").toLowerCase()
                );

                if (!matched) {
                    setNotFound(true);
                    return;
                }

                setCurrentCategory(matched);

                const categoryId = Number(matched.id ?? matched.categoryId);
                const categoryName = (matched.name ?? matched.categoryName ?? "").toLowerCase();

                // Match products either by category_id or by category name
                const filtered = products.filter((p) => {
                    if (p.category_id != null && categoryId) {
                        return Number(p.category_id) === categoryId;
                    }
                    return (p.category ?? "").toLowerCase() === categoryName;
                });

                setCategoryProducts(filtered);
            } catch (err) {
                console.error("[CategoryDetails] Failed to load:", err);
                setNotFound(true);
            } finally {
                setIsLoading(false);
            }
        };
        load();
    }, [category]);

    if (isLoading) {
        return (
            <DashboardLayout>
                <div className="flex flex-col items-center justify-center h-[50vh] gap-3 text-muted-foreground">
                    <svg className="animate-spin w-6 h-6 text-primary" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                    </svg>
                    <span className="text-sm font-medium">Loading category details...</span>
                </div>
            </DashboardLayout>
        );
    }

    if (notFound || !currentCategory) {
        return (
            <DashboardLayout>
                <div className="flex flex-col items-center justify-center h-[50vh]">
                    <h2 className="text-2xl font-bold mb-4">Category Not Found</h2>
                    <Link to="/categories" className="text-primary hover:underline">Back to Categories</Link>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <div className="mb-6">
                <button onClick={() => window.history.back()} className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors mb-4">
                    <ChevronLeft className="w-4 h-4 mr-1" />
                    Back to Categories
                </button>
                <div className="flex items-center gap-4">
                    {(currentCategory.imageUrl || currentCategory.image) && (
                        <img
                            src={currentCategory.imageUrl || currentCategory.image}
                            alt={currentCategory.name}
                            className="w-16 h-16 rounded-xl object-cover shadow-lg"
                        />
                    )}
                    <div>
                        <h1 className="text-3xl font-bold text-foreground">{currentCategory.name ?? currentCategory.categoryName}</h1>
                        <p className="text-muted-foreground">{currentCategory.description}</p>
                    </div>
                </div>
            </div>

            <GlassCard className="p-0 overflow-hidden flex flex-col">
                <div className="overflow-x-auto flex-1">
                    <table className="w-full">
                        <thead>
                            <tr className="text-left text-sm font-medium text-muted-foreground border-b border-border/50">
                                <th className="pb-3 px-5 pt-4">Product</th>
                                <th className="pb-3 px-5 pt-4">Price Range</th>
                                <th className="pb-3 px-5 pt-4">Stock</th>
                                <th className="pb-3 px-5 pt-4">Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {categoryProducts.length > 0 ? (
                                categoryProducts.map((product) => (
                                    <>
                                        <motion.tr
                                            key={product.id}
                                            whileHover={{ backgroundColor: "hsla(130, 85%, 45%, 0.04)" }}
                                            className="border-b border-border/50 cursor-pointer"
                                            onClick={() => setExpandedProduct(expandedProduct === product.id ? null : product.id)}
                                        >
                                            <td className="py-3.5 px-5">
                                                <div className="flex items-center gap-3">
                                                    <img
                                                        src={product.image || (product.images?.[0] ?? "")}
                                                        alt={product.name}
                                                        className="w-10 h-10 rounded-lg object-cover border border-border"
                                                    />
                                                    <div>
                                                        <p className="font-medium text-foreground">{product.name}</p>
                                                        <p className="text-xs text-muted-foreground truncate max-w-[150px]">{product.description}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-3.5 px-5 text-sm font-medium text-foreground">
                                                {product.variants.length > 0
                                                    ? `₹${Math.min(...product.variants.map(v => v.price))} – ₹${Math.max(...product.variants.map(v => v.price))}`
                                                    : "—"}
                                            </td>
                                            <td className="py-3.5 px-5 text-sm text-muted-foreground">
                                                {product.variants.reduce((acc, v) => acc + (v.stock_quantity ?? 0), 0)} Units
                                            </td>
                                            <td className="py-3.5 px-5">
                                                <StatusBadge status={product.is_active ? "Active" : "Inactive"} />
                                            </td>
                                        </motion.tr>
                                        {expandedProduct === product.id && (
                                            <motion.tr initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-muted/30">
                                                <td colSpan={5} className="p-4">
                                                    <div className="bg-background/50 rounded-xl p-4 border border-border/50">
                                                        <h4 className="font-semibold mb-3 text-sm">Product Variants</h4>
                                                        <div className="overflow-x-auto">
                                                            <table className="w-full text-sm">
                                                                <thead>
                                                                    <tr className="border-b border-border/50 text-left text-muted-foreground">
                                                                        <th className="pb-2 font-medium">Variant</th>
                                                                        <th className="pb-2 font-medium">SKU</th>
                                                                        <th className="pb-2 font-medium">Price</th>
                                                                        <th className="pb-2 font-medium">Stock</th>
                                                                        <th className="pb-2 font-medium">Status</th>
                                                                    </tr>
                                                                </thead>
                                                                <tbody>
                                                                    {product.variants.map((variant) => (
                                                                        <tr key={variant.id} className="border-b border-border/50 last:border-0">
                                                                            <td className="py-2">{variant.variant_name}</td>
                                                                            <td className="py-2">{variant.sku}</td>
                                                                            <td className="py-2">₹{variant.price}</td>
                                                                            <td className="py-2">{variant.stock_quantity}</td>
                                                                            <td className="py-2">
                                                                                <span className={`px-2 py-1 rounded-full text-xs ${variant.stock_quantity > 0 ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500"}`}>
                                                                                    {variant.availability_status}
                                                                                </span>
                                                                            </td>
                                                                        </tr>
                                                                    ))}
                                                                </tbody>
                                                            </table>
                                                        </div>
                                                    </div>
                                                </td>
                                            </motion.tr>
                                        )}
                                    </>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={5} className="py-8 text-center text-muted-foreground">
                                        No products found in this category.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </GlassCard>
        </DashboardLayout>
    );
};

export default CategoryDetails;
