// ─────────────────────────────────────────────────────────
//  HOME PAGE — loads 6 most recent listings for preview
// ─────────────────────────────────────────────────────────

async function loadPreviewListings() {
  const grid = document.getElementById('previewGrid');
  if (!grid) return;

  const { data, error } = await db
    .from('listings')
    .select('*')
    .eq('active', true)
    .order('created_at', { ascending: false })
    .limit(6);

  if (error || !data || data.length === 0) {
    grid.innerHTML = `
      <div class="empty-state" style="grid-column:1/-1">
        <p>No listings yet — be the first to list your home!</p>
        <a href="post.html" class="btn btn-primary">List your home</a>
      </div>`;
    return;
  }

  grid.innerHTML = data.map(buildCardHTML).join('');
}

loadPreviewListings();
