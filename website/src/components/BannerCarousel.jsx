import React, { useEffect, useState, useCallback, useRef } from "react";
import { getActiveBanners, API_BASE_URL } from "../api";
import { ChevronLeft, ChevronRight } from "lucide-react";
import "./banner.css";

// Dynamic banner carousel for Svasthya Fresh
// Place it immediately below the header in App:
//   import BannerCarousel from "./components/BannerCarousel";
//   ...
//   <header>...</header>
//   <BannerCarousel />

const BannerCarousel = ({ onNavigateToProducts, onAvailabilityChange }) => {
  const [banners, setBanners] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [resolved, setResolved] = useState(false);
  const scrollContainerRef = useRef(null);

  const hasBanners = Array.isArray(banners) && banners.length > 0;

  useEffect(() => {
    if (!resolved) return;
    if (typeof onAvailabilityChange === "function") {
      onAvailabilityChange(hasBanners);
    }
  }, [resolved, hasBanners, onAvailabilityChange]);

  const normalizeBannersResponse = (json) => {
    console.log("🔍 Normalizing response, input:", json);
    
    if (!json) return [];

    // Direct array
    if (Array.isArray(json)) {
      console.log("✓ Found direct array");
      return json;
    }
    
    // Common nested structures
    if (Array.isArray(json.data)) {
      console.log("✓ Found json.data array");
      return json.data;
    }
    if (Array.isArray(json.banners)) {
      console.log("✓ Found json.banners array");
      return json.banners;
    }
    if (Array.isArray(json.data?.banners)) {
      console.log("✓ Found json.data.banners array");
      return json.data.banners;
    }
    if (Array.isArray(json.items)) {
      console.log("✓ Found json.items array");
      return json.items;
    }
    if (Array.isArray(json.data?.items)) {
      console.log("✓ Found json.data.items array");
      return json.data.items;
    }
    
    // Check for single banner object wrapped in data
    if (json.data && typeof json.data === 'object' && !Array.isArray(json.data)) {
      console.log("✓ Found json.data object, checking for banner fields");
      // If data is a single banner object, wrap it in array
      if (json.data.id || json.data.bannerId || json.data.imageUrl || json.data.image_url) {
        console.log("✓ Wrapping single banner in array");
        return [json.data];
      }
    }
    
    // Check if json itself is a single banner object
    if (json.id || json.bannerId || json.imageUrl || json.image_url) {
      console.log("✓ Wrapping single banner (root level) in array");
      return [json];
    }

    console.warn("⚠️ Could not find banners in response structure");
    console.log("Available keys:", Object.keys(json));
    return [];
  };

  const fetchBanners = useCallback(async () => {
    setLoading(true);
    setError("");
    setResolved(false);
    try {
      console.log("🎨 Fetching banners from API...");
      const res = await getActiveBanners();
      console.log("🎨 Banner API response:", res);
      console.log("🎨 Banner API res.data:", res?.data);
      
      const list = normalizeBannersResponse(res?.data ?? res);
      console.log("🎨 Normalized banners list:", list);
      
      if (Array.isArray(list) && list.length > 0) {
        console.log(`✅ Successfully loaded ${list.length} banners`);
        setBanners(list);
        setCurrentIndex(0);
      } else {
        console.warn("⚠️ No banners found in API response");
        setBanners([]);
      }
    } catch (err) {
      console.error("❌ Failed to load banners:", err);
      console.error("❌ Error details:", err.message, err.response);
      setError("We couldn't load today's offers.");
      setBanners([]);
    } finally {
      setLoading(false);
      setResolved(true);
    }
  }, []);

  useEffect(() => {
    fetchBanners();
  }, [fetchBanners]);

  // Auto-play logic (scroll every 5s)
  useEffect(() => {
    if (!hasBanners || banners.length <= 1) return;
    
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1 >= banners.length ? 0 : prev + 1));
    }, 5000); // Change every 5 seconds

    return () => clearInterval(interval);
  }, [hasBanners, banners.length]);

  // Scroll to the active banner whenever currentIndex changes
  useEffect(() => {
    if (!hasBanners || !scrollContainerRef.current || banners.length === 0) return;

    const container = scrollContainerRef.current;
    const scrollWidth = container.scrollWidth;
    const scrollPosition = (scrollWidth / banners.length) * currentIndex;

    container.scrollTo({
      left: scrollPosition,
      behavior: 'smooth',
    });
  }, [currentIndex, hasBanners, banners.length]);

  const handleDotClick = (index) => {
    setCurrentIndex(index);
  };

  const handlePrevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 < 0 ? banners.length - 1 : prev - 1));
  };

  const handleNextSlide = () => {
    setCurrentIndex((prev) => (prev + 1 >= banners.length ? 0 : prev + 1));
  };

  // --- Touch swipe support (mobile) ---
  const touchStartXRef = useRef(null);
  const touchDeltaXRef = useRef(0);

  const handleTouchStart = (e) => {
    if (!hasBanners) return;
    const touch = e.touches[0];
    touchStartXRef.current = touch.clientX;
    touchDeltaXRef.current = 0;
  };

  const handleTouchMove = (e) => {
    if (touchStartXRef.current == null) return;
    const touch = e.touches[0];
    touchDeltaXRef.current = touch.clientX - touchStartXRef.current;
  };

  const handleTouchEnd = () => {
    if (!hasBanners || touchStartXRef.current == null) {
      touchStartXRef.current = null;
      touchDeltaXRef.current = 0;
      return;
    }

    const deltaX = touchDeltaXRef.current;
    const threshold = 50; // px

    if (Math.abs(deltaX) > threshold && banners.length > 1) {
      if (deltaX < 0) {
        // swipe left -> next slide
        setCurrentIndex((prev) => (prev + 1 >= banners.length ? 0 : prev + 1));
      } else {
        // swipe right -> previous slide
        setCurrentIndex((prev) => (prev - 1 < 0 ? banners.length - 1 : prev - 1));
      }
    }

    touchStartXRef.current = null;
    touchDeltaXRef.current = 0;
  };

  const renderContent = () => {
    // When banners aren't available, render nothing.
    // (Landing page hero handles the no-banner design.)
    if (loading || error || !hasBanners) return null;

    return (
      <div className="banner-carousel-wrapper relative w-full">
        {/* Horizontal scrollable container */}
        <div 
          ref={scrollContainerRef}
          className="banner-carousel-scroll flex gap-4 overflow-x-auto scroll-smooth snap-x snap-mandatory pb-4"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          style={{ 
            scrollbarWidth: 'thin',
            scrollbarColor: '#7C3225 #FEF8F0'
          }}
        >
          {banners.map((banner, index) => {
            // Build image URL from API data; prefix relative paths with API_BASE_URL
            let slideImage =
              banner.image_url ||
              banner.imageUrl ||
              banner.banner_image ||
              banner.bannerImage ||
              banner.image ||
              banner.img ||
              (Array.isArray(banner.images) && (
                banner.images[0]?.image_url ||
                banner.images[0]?.imageUrl ||
                banner.images[0]?.url ||
                banner.images[0]?.image
              )) ||
              "/1st.png";

            if (slideImage && !/^https?:\/\//i.test(slideImage) && !slideImage.startsWith("//")) {
              slideImage = `${API_BASE_URL}${slideImage}`;
            }

            const slideTitle =
              banner.title ||
              banner.heading ||
              banner.headline ||
              banner.text ||
              "Svasthya Fresh";

            const slideSubtitle =
              banner.subtitle ||
              banner.subheading ||
              banner.description ||
              banner.caption ||
              "Pure, natural and honest food for everyday wellness.";

            const slideCtaLabel =
              banner.ctaLabel || banner.ctaText || banner.buttonText || "Shop Now";

            const slideCtaLink =
              banner.ctaLink || banner.link || banner.href || banner.customPageUrl || null;

            // Extract category - check multiple possible field names
            const slideCategory =
              banner.redirectTo ||  // Primary field from your API
              banner.category || 
              banner.category_name || 
              banner.categoryName || 
              banner.categoryId ||
              banner.category_id ||
              banner.targetCategory ||
              banner.target_category ||
              null;

            const onSlideCtaClick = (e) => {
              e.stopPropagation(); // Prevent parent div click
              console.log("[Banner Click] Full banner object:", banner);
              console.log("[Banner Click] Extracted category:", slideCategory);
              console.log("[Banner Click] ctaLink:", slideCtaLink);
              
              // Prioritize category from backend
              if (slideCategory) {
                console.log("[Banner Click] Navigating to category:", slideCategory);
                if (onNavigateToProducts) {
                  onNavigateToProducts(slideCategory);
                }
              } else if (slideCtaLink) {
                // Fallback to ctaLink if no category
                // If link looks like internal navigation (e.g., "honey", "ghee", "chikki", etc)
                if (!slideCtaLink.includes('http') && !slideCtaLink.startsWith('/')) {
                  // Internal category navigation
                  console.log("[Banner Click] Navigating to ctaLink (category):", slideCtaLink);
                  if (onNavigateToProducts) {
                    onNavigateToProducts(slideCtaLink);
                  }
                } else if (slideCtaLink.startsWith('/')) {
                  // Internal route
                  console.log("[Banner Click] Navigating to route:", slideCtaLink);
                  window.location.href = slideCtaLink;
                } else {
                  // External URL
                  console.log("[Banner Click] Opening external URL:", slideCtaLink);
                  window.open(slideCtaLink, '_blank');
                }
              } else {
                // Default: go to products page if no category/link
                console.log("[Banner Click] No category/link found, going to All products");
                if (onNavigateToProducts) {
                  onNavigateToProducts("All");
                }
              }
            };

            return (
              <div
                key={banner.id || index}
                className="banner-slide relative h-[50vh] md:h-[50vh] min-w-full flex-shrink-0 overflow-hidden snap-center"
                style={{ borderRadius: '48px' }}
              >
                {/* Full-bleed image */}
                <img
                  src={slideImage}
                  alt={slideTitle}
                  className="absolute inset-0 h-full w-full object-cover"
                  style={{ borderRadius: '48px' }}
                />

                {/* Text overlay */}
                <div className="banner-overlay relative z-10 flex h-full w-full items-center" style={{ borderRadius: '48px' }}>
                  <div className="banner-gradient flex h-full w-full items-center bg-gradient-to-r from-black/55 via-black/35 to-black/5 px-6 py-6 md:px-10 md:py-8" style={{ borderRadius: '48px' }}>
                    <div className="max-w-md text-left text-white">
                      <p className="text-[11px] font-semibold tracking-[0.28em] text-emerald-200 uppercase">
                        Natural • Wholesome • Fresh
                      </p>
                      <h2 className="mt-2 text-2xl font-semibold leading-snug md:text-3xl">
                        {slideTitle}
                      </h2>
                      <p className="mt-3 text-xs text-slate-100/90 md:text-sm">
                        {slideSubtitle}
                      </p>
                      <button
                        type="button"
                        onClick={onSlideCtaClick}
                        className="mt-4 inline-flex items-center rounded-full bg-[#FACC6B] px-5 py-2 text-xs font-semibold text-[#6D3123] shadow-md shadow-black/30 transition-colors hover:bg-[#FBBF24] md:text-sm"
                      >
                        {slideCtaLabel}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const content = renderContent();
  if (!content) return null;

  return (
    <section className="w-full bg-[#FDF8F1]" style={{ marginBottom: '250px' }}>
      <div className="mx-auto w-full max-w-7xl px-4 pb-0 pt-1 md:px-6 md:pb-0 md:pt-2">
        {content}
      </div>
    </section>
  );
};

export default BannerCarousel;
