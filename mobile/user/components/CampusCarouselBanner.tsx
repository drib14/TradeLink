import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useMarket } from '../context/MarketContext';
import { useAuth } from '../context/AuthContext';
import { Campus } from '../types';

export interface CampusSlide {
  id: string;
  campusName: string;
  shortTag: Campus | 'All Campuses';
  title: string;
  subtitle: string;
  imageUrl: string;
  highlight: string;
  colleges: string;
}

export const CAMPUS_SLIDES: CampusSlide[] = [
  {
    id: 'slide-main',
    campusName: 'UC Main Campus',
    shortTag: 'UC Main',
    title: 'UC Main Marketplace Hub',
    subtitle: 'Trade CCS coding books, Engineering drafting tools, Law and CBA reviewers, laptops, and uniforms safely.',
    imageUrl: 'https://images.unsplash.com/photo-1541829070764-84a7d30dd3f3?w=800&auto=format&fit=crop&q=80',
    highlight: 'Sanciangko & J. Alcantara Student Hub',
    colleges: 'CCS • CBA • Law • Crim • SHS',
  },
  {
    id: 'slide-banilad',
    campusName: 'UC Banilad Campus',
    shortTag: 'UC Banilad',
    title: 'UC Banilad Student Exchange',
    subtitle: 'Buy, sell, and swap clinical scrubs, nursing duty kits, medical reviewers, and dorm essentials with fellow Banilad students.',
    imageUrl: 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=800&auto=format&fit=crop&q=80',
    highlight: 'Banilad Atrium & Cafeteria Plaza',
    colleges: 'Nursing • Allied Health • CBA • Medicine',
  },
  {
    id: 'slide-lm',
    campusName: 'UC Lapu-Lapu & Mandaue (LM)',
    shortTag: 'UC LM',
    title: 'UC LM Engineering & Tech Barter',
    subtitle: 'Peer-to-peer campus exchange for Engineering kits, scientific calculators, PC peripherals, uniforms, and student gadgets in Mandaue.',
    imageUrl: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=800&auto=format&fit=crop&q=80',
    highlight: 'A.C. Cortes Campus Hub',
    colleges: 'Engineering • IT • Business • Tourism',
  },
  {
    id: 'slide-metc',
    campusName: 'UC METC Maritime Center',
    shortTag: 'UC METC',
    title: 'UC METC Maritime Trading Post',
    subtitle: 'Cadet-to-cadet marketplace for merchant marine uniforms, shoulder boards, navigation reviewers, safety gear, and electronics.',
    imageUrl: 'https://images.unsplash.com/photo-1509062522246-3755977927d7?w=800&auto=format&fit=crop&q=80',
    highlight: 'Alumnos St. Campus Grounds',
    colleges: 'BSMT • BSMarE • Naval Architecture',
  },
  {
    id: 'slide-pri',
    campusName: 'UC PRI (Junior & Senior High)',
    shortTag: 'UC PRI',
    title: 'UC PRI High School Marketplace',
    subtitle: 'Direct student exchange for Junior High (Grades 7–10) reviewers, Senior High STEM/ABM modules, PE uniforms, and calculators.',
    imageUrl: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=800&auto=format&fit=crop&q=80',
    highlight: 'J. Alcantara Student Zone',
    colleges: 'Junior High • STEM • ABM • HUMSS • TVL',
  },
  {
    id: 'slide-pt',
    campusName: 'UC Pardo-Talisay',
    shortTag: 'UC Pardo-Talisay',
    title: 'UC Pardo-Talisay Student Market',
    subtitle: 'South Cebu student board for pre-loved textbooks, uniforms, tech gadgets, and school gear with verified campus peers.',
    imageUrl: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=800&auto=format&fit=crop&q=80',
    highlight: 'Pardo-Talisay Campus Plaza',
    colleges: 'SHS • Education • Criminology • CBA',
  },
  {
    id: 'slide-all',
    campusName: 'All Campuses Network',
    shortTag: 'All Campuses',
    title: 'TradeLink Inter-Campus Network',
    subtitle: 'Our student-powered marketplace and barter network connecting peers across all 8 campuses. 0% fees, 100% verified students.',
    imageUrl: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=800&auto=format&fit=crop&q=80',
    highlight: 'Unified Student Barter Network',
    colleges: 'All 8 Campuses • High School • College',
  },
];

export const CampusCarouselBanner: React.FC = () => {
  const [currentIdx, setCurrentIdx] = useState(0);
  const { setSelectedCampus } = useMarket();
  const { currentUser, openAuthModal } = useAuth();

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIdx((prev) => (prev + 1) % CAMPUS_SLIDES.length);
    }, 5500);
    return () => clearInterval(timer);
  }, []);

  const slide = CAMPUS_SLIDES[currentIdx];

  const handleCampusAction = () => {
    if (slide.shortTag === 'All Campuses') {
      setSelectedCampus('All');
    } else {
      setSelectedCampus(slide.shortTag);
    }
    router.push('/marketplace');
  };

  const handlePostAction = () => {
    if (!currentUser) {
      openAuthModal();
    } else {
      router.push('/create-listing');
    }
  };

  return (
    <View style={styles.container}>
      {/* Background Image */}
      <Image source={{ uri: slide.imageUrl }} style={styles.bgImage} />

      {/* Deep Navy Glass Gradient Overlay */}
      <View style={styles.gradientOverlay} />

      {/* Slide Content */}
      <View style={styles.content}>
        {/* Top Badges */}
        <View style={styles.badgesRow}>
          <View style={styles.campusNumberBadge}>
            <Ionicons name="business" size={11} color="#002B7F" />
            <Text style={styles.campusNumberText}>
              {slide.shortTag === 'All Campuses'
                ? 'All Campuses'
                : `Campus ${currentIdx + 1} of 8`}
            </Text>
          </View>

          <View style={styles.hubBadge}>
            <Ionicons name="location" size={11} color="#FFC72C" />
            <Text style={styles.hubBadgeText} numberOfLines={1}>
              {slide.highlight}
            </Text>
          </View>
        </View>

        {/* Title & Subtitle */}
        <View style={styles.textSection}>
          <Text style={styles.title} numberOfLines={2}>
            {slide.title}
          </Text>
          <Text style={styles.subtitle} numberOfLines={2}>
            {slide.subtitle}
          </Text>
          <View style={styles.collegesRow}>
            <Ionicons name="school" size={12} color="#FFC72C" />
            <Text style={styles.collegesText} numberOfLines={1}>
              {slide.colleges}
            </Text>
          </View>
        </View>

        {/* Action Buttons & Indicator */}
        <View style={styles.bottomRow}>
          <View style={styles.actionsRow}>
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={handleCampusAction}
              activeOpacity={0.85}
            >
              <Text style={styles.primaryButtonText}>
                {slide.shortTag === 'All Campuses' ? 'Browse Items' : `Browse ${slide.shortTag}`}
              </Text>
              <Ionicons name="arrow-forward" size={12} color="#002B7F" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={handlePostAction}
              activeOpacity={0.8}
            >
              <Ionicons name="add-circle-outline" size={13} color="#FFFFFF" />
              <Text style={styles.secondaryButtonText}>Post</Text>
            </TouchableOpacity>
          </View>

          {/* Slide Indicator Dots */}
          <View style={styles.dotsRow}>
            {CAMPUS_SLIDES.map((s, idx) => {
              const isActive = idx === currentIdx;
              return (
                <TouchableOpacity
                  key={s.id}
                  onPress={() => setCurrentIdx(idx)}
                  style={[styles.dot, isActive && styles.dotActive]}
                />
              );
            })}
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 12,
    marginTop: 8,
    marginBottom: 6,
    borderRadius: 18,
    overflow: 'hidden',
    minHeight: 220,
    backgroundColor: '#001D59',
    position: 'relative',
    shadowColor: '#002B7F',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 6,
  },
  bgImage: {
    width: '100%',
    height: '100%',
    position: 'absolute',
    opacity: 0.35,
  },
  gradientOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 29, 89, 0.82)',
  },
  content: {
    flex: 1,
    padding: 14,
    justifyContent: 'space-between',
    gap: 8,
  },
  badgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  campusNumberBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFC72C',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 9999,
    gap: 4,
  },
  campusNumberText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#002B7F',
    textTransform: 'uppercase',
  },
  hubBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 9999,
    gap: 4,
  },
  hubBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  textSection: {
    marginVertical: 4,
  },
  title: {
    fontSize: 16,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -0.2,
    lineHeight: 20,
  },
  subtitle: {
    fontSize: 11,
    color: '#E2E8F0',
    marginTop: 3,
    lineHeight: 15,
  },
  collegesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  collegesText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFC72C',
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    marginTop: 4,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFC72C',
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
  },
  primaryButtonText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#002B7F',
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 3,
  },
  secondaryButtonText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  dotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
  },
  dotActive: {
    width: 14,
    backgroundColor: '#FFC72C',
  },
});
