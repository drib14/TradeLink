import React, { useState, useEffect } from 'react';
import { useMarket } from '../context/MarketContext';
import { ListingCard } from '../components/marketplace/ListingCard';
import { CampusCarouselBanner } from '../components/home/CampusCarouselBanner';
import { ListingCardSkeleton } from '../components/common/SkeletonLoader';
import { Campus, Listing } from '../types';
import {
  ArrowRight,
  ShieldCheck,
  Plus,
  Sparkles,
  Zap,
  Package,
  Layers,
  MapPin
} from 'lucide-react';

interface HomePageProps {
  onNavigate: (view: string, param?: any) => void;
}

export const HomePage: React.FC<HomePageProps> = ({ onNavigate }) => {
  const { listings, selectedCampus, setSelectedCampus, setSelectedCategory } = useMarket();
  const [isSimulatingLoading, setIsSimulatingLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsSimulatingLoading(false);
    }, 200);
    return () => clearTimeout(timer);
  }, []);

  const boostedListings = listings.filter((l: Listing) => l.isBoosted && !l.isSold);
  const recentListings = listings.filter((l: Listing) => !l.isSold);

  const popularTags = [
    { label: 'All Items', tag: 'All' },
    { label: 'Junior & Senior High', tag: 'Junior High School Books & Reviewers' },
    { label: 'Phones & Tablets', tag: 'Electronics' },
    { label: 'Sneakers & Footwear', tag: 'Fashion' },
    { label: 'STEM & Drafting Kits', tag: 'Senior High School Modules & Kits' },
    { label: 'Textbooks & Notes', tag: 'College Textbooks & Notes' },
    { label: 'Uniforms & Scrubs', tag: 'Uniforms, PE Attire & Scrubs' },
    { label: 'Keyboards & Gaming', tag: 'Gaming' }
  ];

  const handleTagClick = (tag: string) => {
    setSelectedCategory(tag);
    onNavigate('marketplace');
  };

  const handleCampusSelect = (campus: Campus | 'ALL') => {
    setSelectedCampus(campus === 'ALL' ? 'All' : campus);
    onNavigate('marketplace');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem', paddingBottom: '5rem' }}>
      {/* 1. University of Cebu Carousel Banner */}
      <section className="container" style={{ paddingTop: '1.25rem' }}>
        <CampusCarouselBanner
          onSelectCampus={handleCampusSelect}
          onPostListing={() => onNavigate('create-listing')}
        />
      </section>

      {/* 2. Campus Quick Selector & Free Tags Bar */}
      <section className="container">
        <div
          className="clean-card"
          style={{
            padding: '1.25rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem'
          }}
        >
          {/* Campuses */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem', minWidth: 0, width: '100%' }}>
            <div className="touch-scroll-row" style={{ flex: '1 1 0%', minWidth: 0, width: '100%', paddingBottom: '2px' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#002B7F', textTransform: 'uppercase', letterSpacing: '0.04em', whiteSpace: 'nowrap', marginRight: '0.35rem', flexShrink: 0, display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                <MapPin size={14} color="#002B7F" style={{ flexShrink: 0 }} /> Filter Campus:
              </span>
              <button
                onClick={() => {
                  setSelectedCampus('All');
                  onNavigate('marketplace');
                }}
                style={{
                  padding: '0.4rem 0.95rem',
                  borderRadius: '9999px',
                  fontSize: '0.8rem',
                  fontWeight: selectedCampus === 'All' ? 800 : 600,
                  backgroundColor: selectedCampus === 'All' ? '#002B7F' : '#F1F5F9',
                  color: selectedCampus === 'All' ? '#FFFFFF' : '#334155',
                  border: selectedCampus === 'All' ? '1.5px solid #002B7F' : '1px solid #CBD5E1',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.15s ease',
                  flexShrink: 0,
                  cursor: 'pointer'
                }}
              >
                All Campuses
              </button>
              {([
                'UC Main',
                'UC Banilad',
                'UC LM',
                'UC METC',
                'UC PRI',
                'UC Pardo-Talisay',
                'UC South Campus',
                'UC Medical Center'
              ] as Campus[]).map((c) => (
                <button
                  key={c}
                  onClick={() => {
                    setSelectedCampus(c);
                    onNavigate('marketplace');
                  }}
                  style={{
                    padding: '0.4rem 0.95rem',
                    borderRadius: '9999px',
                    fontSize: '0.8rem',
                    fontWeight: selectedCampus === c ? 800 : 600,
                    backgroundColor: selectedCampus === c ? '#002B7F' : '#F1F5F9',
                    color: selectedCampus === c ? '#FFFFFF' : '#334155',
                    border: selectedCampus === c ? '1.5px solid #002B7F' : '1px solid #CBD5E1',
                    whiteSpace: 'nowrap',
                    transition: 'all 0.15s ease',
                    flexShrink: 0,
                    cursor: 'pointer'
                  }}
                >
                  {c}
                </button>
              ))}
            </div>

            <div className="desktop-only" style={{ gap: '0.5rem' }}>
              <button
                onClick={() => onNavigate('create-listing')}
                className="btn-gold"
                style={{ padding: '0.45rem 1rem', fontSize: '0.82rem', whiteSpace: 'nowrap' }}
              >
                <Plus size={15} style={{ flexShrink: 0 }} />
                <span>Sell / Swap</span>
              </button>
            </div>
          </div>

          {/* Tags Chips */}
          <div className="touch-scroll-row" style={{ width: '100%', minWidth: 0, borderTop: '1px solid #F1F5F9', paddingTop: '0.85rem' }}>
            {popularTags.map((item, idx) => (
              <button
                key={idx}
                onClick={() => handleTagClick(item.tag)}
                style={{
                  padding: '0.35rem 0.85rem',
                  borderRadius: '9999px',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  backgroundColor: '#F8FAFC',
                  color: '#1E293B',
                  border: '1px solid #CBD5E1',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.15s ease',
                  cursor: 'pointer'
                }}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* 3. Featured Active Listings across UC */}
      {boostedListings.length > 0 && (
        <section className="container">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <div style={{ backgroundColor: '#FFF2CC', padding: '0.4rem', borderRadius: '8px', color: '#B45309', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Zap size={20} fill="#FFC72C" color="#D49400" style={{ flexShrink: 0 }} />
              </div>
              <div>
                <h3 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#0F172A' }}>
                  Featured Campus Deals
                </h3>
                <p style={{ fontSize: '0.82rem', color: '#64748B' }}>
                  Top verified listings with high student demand
                </p>
              </div>
            </div>

            <button
              onClick={() => onNavigate('marketplace')}
              style={{ fontSize: '0.84rem', fontWeight: 800, color: '#002B7F', display: 'inline-flex', alignItems: 'center', gap: '0.35rem', cursor: 'pointer' }}
            >
              <span>View all</span> <ArrowRight size={14} style={{ flexShrink: 0 }} />
            </button>
          </div>

          <div className="grid-responsive-listings">
            {isSimulatingLoading
              ? Array.from({ length: 4 }).map((_, i) => <ListingCardSkeleton key={i} />)
              : boostedListings.map((item: Listing) => (
                  <ListingCard
                    key={item.id}
                    listing={item}
                    onClick={() => onNavigate('item-detail', { id: item.id })}
                  />
                ))}
          </div>
        </section>
      )}

      {/* 4. Safe Campus Trade Zones Spotlight */}
      <section className="container">
        <div
          style={{
            background: 'linear-gradient(135deg, #002B7F 0%, #001D59 100%)',
            color: '#FFFFFF',
            borderRadius: '18px',
            padding: '2.25rem',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '2rem',
            alignItems: 'center',
            boxShadow: '0 12px 30px rgba(0, 43, 127, 0.22)'
          }}
        >
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: '#FFC72C', fontSize: '0.8rem', fontWeight: 800 }}>
              <ShieldCheck size={16} style={{ flexShrink: 0 }} />
              <span>OFFICIAL UNIVERSITY OF CEBU SAFE TRADE ZONES</span>
            </div>
            <h3 style={{ fontSize: '1.65rem', fontWeight: 900, color: '#FFFFFF', marginTop: '0.45rem', fontFamily: 'var(--font-display)', lineHeight: 1.25 }}>
              Trade anything safely on campus with verified students
            </h3>
            <p style={{ fontSize: '0.88rem', color: '#E2E8F0', marginTop: '0.65rem', lineHeight: 1.6 }}>
              Meet directly at the UC Main Lobby, UC Banilad Canteen, UC LM Innovation Hub, or UC METC Flagpole. Inspect your gadget, pair of shoes, or reviewer on the spot and confirm handshakes with the 4-digit code.
            </p>
            <div style={{ marginTop: '1.5rem', display: 'flex', gap: '0.85rem', flexWrap: 'wrap' }}>
              <button
                onClick={() => onNavigate('meetups')}
                className="btn-gold"
                style={{ fontSize: '0.85rem' }}
              >
                <ShieldCheck size={15} style={{ flexShrink: 0 }} />
                <span>Safe Meetup Guide & Locations</span>
              </button>
              <button
                onClick={() => onNavigate('create-listing')}
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.15)',
                  color: '#FFFFFF',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  padding: '0.6rem 1.25rem',
                  borderRadius: '10px',
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  cursor: 'pointer'
                }}
              >
                <Plus size={15} style={{ flexShrink: 0 }} />
                <span>Post an Item</span>
              </button>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', backgroundColor: 'rgba(255, 255, 255, 0.08)', padding: '1.5rem', borderRadius: '14px', backdropFilter: 'blur(8px)', border: '1px solid rgba(255, 255, 255, 0.15)' }}>
            <div style={{ fontSize: '0.86rem', fontWeight: 800, color: '#FFC72C', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
              <MapPin size={15} style={{ flexShrink: 0 }} /> All-Campus Safe Meetup Hubs:
            </div>
            <div style={{ fontSize: '0.82rem', color: '#F1F5F9', display: 'flex', flexDirection: 'column', gap: '0.5rem', lineHeight: 1.45 }}>
              <div><strong>UC Main:</strong> Sanciangko Gate Security Desk & 3rd Floor Library</div>
              <div><strong>UC Banilad:</strong> Canteen Atrium & Building A Guard Station</div>
              <div><strong>UC LM:</strong> Innovation Center & Student Pavilion Gazebo</div>
              <div><strong>UC METC:</strong> Maritime Quadrangle & Bridge Simulator Lobby</div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. All Campus Listings Stream (Full Screen Width Grid) */}
      <section className="container">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
          <div>
            <h3 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#0F172A' }}>
              Explore All Campus Items
            </h3>
            <p style={{ fontSize: '0.84rem', color: '#64748B' }}>
              Gadgets, footwear, musical gear, textbooks, scrubs, and dorm essentials
            </p>
          </div>

          <button
            onClick={() => onNavigate('marketplace')}
            style={{ fontSize: '0.84rem', fontWeight: 800, color: '#002B7F', display: 'inline-flex', alignItems: 'center', gap: '0.35rem', cursor: 'pointer' }}
          >
            <span>Open Market Grid</span> <ArrowRight size={14} style={{ flexShrink: 0 }} />
          </button>
        </div>

        <div className="grid-responsive-listings">
          {isSimulatingLoading
            ? Array.from({ length: 8 }).map((_, i) => <ListingCardSkeleton key={i} />)
            : recentListings.map((item: Listing) => (
                <ListingCard
                  key={item.id}
                  listing={item}
                  onClick={() => onNavigate('item-detail', { id: item.id })}
                />
              ))}
        </div>
      </section>
    </div>
  );
};
