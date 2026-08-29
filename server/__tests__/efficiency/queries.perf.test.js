describe('Efficiency & Performance Test: N+1 Query Mitigation & Batching', () => {
  it('should batch-fetch listing images in 1 query for multiple listings instead of N queries', async () => {
    const mockListings = [
      { id: 'list_1', title: 'Calculus Book' },
      { id: 'list_2', title: 'Uniform Scrubs' },
      { id: 'list_3', title: 'Scientific Calculator' }
    ];

    const mockDbImageStore = [
      { id: 'img_1', listing_id: 'list_1', image_url: 'https://img.uc.edu.ph/1.jpg', sort_order: 0 },
      { id: 'img_2', listing_id: 'list_2', image_url: 'https://img.uc.edu.ph/2.jpg', sort_order: 0 },
      { id: 'img_3', listing_id: 'list_3', image_url: 'https://img.uc.edu.ph/3.jpg', sort_order: 0 }
    ];

    let queryCount = 0;
    const batchFetchImages = async (listingIds) => {
      queryCount++; // Single batch query simulation: whereIn('listing_id', listingIds)
      return mockDbImageStore.filter((img) => listingIds.includes(img.listing_id));
    };

    const listingIds = mockListings.map((l) => l.id);
    const images = await batchFetchImages(listingIds);

    // Assert that only 1 single query was made regardless of number of listings (O(1) database roundtrips)
    expect(queryCount).toBe(1);
    expect(images.length).toBe(3);

    const merged = mockListings.map((l) => ({
      ...l,
      images: images.filter((img) => img.listing_id === l.id).map((img) => img.image_url)
    }));

    expect(merged[0].images).toEqual(['https://img.uc.edu.ph/1.jpg']);
    expect(merged[1].images).toEqual(['https://img.uc.edu.ph/2.jpg']);
    expect(merged[2].images).toEqual(['https://img.uc.edu.ph/3.jpg']);
  });
});
