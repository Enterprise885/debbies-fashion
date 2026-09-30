import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const config = window.SUPABASE_CONFIG ?? {};
const configured = config.url?.startsWith('https://') && config.anonKey && !config.anonKey.startsWith('YOUR_');
const authForm = document.querySelector('#authForm');
const authSubmit = document.querySelector('#authSubmit');
const authMessage = document.querySelector('#authMessage');
const nameGroup = document.querySelector('#nameGroup');
const nameInput = document.querySelector('#nameInput');
const emailInput = document.querySelector('#emailInput');
const passwordInput = document.querySelector('#passwordInput');
let supabase;
let authMode = 'login';
let activeUser;
let activeCategory = 'All pieces';
let searchTerm = '';
let savedOnly = false;
let savedDesignIds = new Set();
let isStaff = false;
let toastTimer;

const categories = ['All pieces', 'Dresses', 'Skirts', 'Sets', 'Tops', 'Traditional', 'Evening'];
const designs = [
  ['look-01', 'The Sunday Dress', 'Dresses', 'Soft volume, a little romance.', 'photo-1566174053879-31528523f8ae', 'EASY ELEGANCE'],
  ['look-02', 'City in Bloom', 'Sets', 'A matching set that means business.', 'photo-1594633312681-425c7b97ccd1', 'TWO-PIECE'],
  ['look-03', 'After Hours', 'Evening', 'The entrance is part of the outfit.', 'photo-1539008835657-9e8e9680c956', 'OCCASION'],
  ['look-04', 'Soft Structure', 'Tops', 'A beautiful line from every angle.', 'photo-1551163943-3f6a855d1153', 'MODERN CLASSIC'],
  ['look-05', 'Sunday Best', 'Dresses', 'An old favourite, made new.', 'photo-1595777457583-95e059d581b8', 'THE FOREVER PIECE'],
  ['look-06', 'The Good Trouser', 'Sets', 'Relaxed tailoring, considered fit.', 'photo-1483985988355-763728e1935b', 'EVERYDAY'],
  ['look-07', 'Little Black Moment', 'Evening', 'For the plans worth dressing up for.', 'photo-1566174053879-31528523f8ae', 'AFTER DARK'],
  ['look-08', 'The Gathered Top', 'Tops', 'A lovely detail does all the talking.', 'photo-1551163943-3f6a855d1153', 'MADE TO MOVE'],
  ['look-09', 'Sunday in Lagos', 'Dresses', 'A little colour, a lot of character.', 'photo-1612722432474-b971cdcea546', "THE DEBBIE'S EDIT"],
  ['look-10', 'The Modern Muse', 'Sets', 'Your new favourite combination.', 'photo-1483985988355-763728e1935b', 'TWO-PIECE'],
  ['look-11', 'Golden Hour', 'Evening', 'Save this one for the celebration.', 'photo-1566174053879-31528523f8ae', 'OCCASION'],
  ['look-12', 'Everyday, Elevated', 'Tops', 'The kind of top you reach for again.', 'photo-1551163943-3f6a855d1153', 'WARDROBE STAPLE'],
  ['look-13', 'Ankara Party Gown', 'Dresses', 'A joyful print with a sweeping, made-to-measure skirt.', 'photo-1529139574466-a303027c1d8b', 'ANKARA EDIT'],
  ['look-14', 'Aso-Ebi Mermaid Gown', 'Traditional', 'A sculpted celebration silhouette with room for your own fabric story.', 'photo-1539008835657-9e8e9680c956', 'CELEBRATION'],
  ['look-15', 'Iro & Buba', 'Traditional', 'A graceful Yoruba two-piece with a flowing wrapper and relaxed buba.', 'photo-1525507119028-ed4c629a60a3', 'YORUBA CLASSIC'],
  ['look-16', 'Ankara Circle Skirt', 'Skirts', 'Full, swishy volume that lets a bold print take the lead.', 'photo-1509631179647-0177331693ae', 'FULL SKIRT'],
  ['look-17', 'Adire Wrap Skirt', 'Skirts', 'A relaxed wrap shape inspired by the beauty of indigo adire.', 'photo-1612722432474-b971cdcea546', 'ADIRE INSPIRATION'],
  ['look-18', 'The High-Waist Pencil', 'Skirts', 'A clean fitted line for work days and dinner plans.', 'photo-1583496661160-fb5886a0aaaa', 'WARDROBE STAPLE'],
  ['look-19', 'Aso-Oke Occasion Set', 'Traditional', 'A polished skirt-and-blouse pairing for a special gathering.', 'photo-1524504388940-b1c1722653e1', 'OCCASION SET'],
  ['look-20', 'The Easy Boubou', 'Traditional', 'An airy, generous kaftan silhouette with beautiful movement.', 'photo-1534528741775-53994a69daeb', 'EASE & ELEGANCE'],
  ['look-21', 'Peplum & Pencil', 'Sets', 'A defined peplum top paired with a simple fitted skirt.', 'photo-1515886657613-9f3515b0c78f', 'TWO-PIECE'],
  ['look-22', 'Ankara Pleated Skirt', 'Skirts', 'Soft pleats bring movement to a favourite printed fabric.', 'photo-1523398002811-999ca8dec234', 'PRINT & PLEATS'],
  ['look-23', 'Wrapper & Blouse Set', 'Traditional', 'A versatile blouse and wrapper pairing to style your way.', 'photo-1591047139829-d91aecb6caea', 'MADE YOUR WAY'],
  ['look-24', 'Cape-Sleeve Reception Gown', 'Evening', 'A graceful sleeve detail for a memorable entrance.', 'photo-1566174053879-31528523f8ae', 'RECEPTION'],
  ['look-25', 'The Ankara Midi', 'Dresses', 'An easy everyday dress with a little Lagos colour.', 'photo-1595777457583-95e059d581b8', 'EVERYDAY PRINT'],
  ['look-26', 'Lagos After Dark', 'Evening', 'A confident evening silhouette, tailored to your occasion.', 'photo-1539109136881-3be0616acf4b', 'AFTER HOURS'],
  ['look-27', 'Yoruba Oleku Set', 'Traditional', 'A Yoruba-inspired short-sleeve top and wrapper set for celebrations.', 'photo-1525507119028-ed4c629a60a3', 'YORUBA'],
  ['look-28', 'Aso-Oke Iro and Buba', 'Traditional', 'A Yoruba occasion look pairing a woven aso-oke wrapper and buba.', 'photo-1524504388940-b1c1722653e1', 'YORUBA'],
  ['look-29', 'Aso-Ebi Lace Gown', 'Dresses', 'A Nigerian celebration gown idea with lace, shaping, and a gele-ready neckline.', 'photo-1566174053879-31528523f8ae', 'CELEBRATION'],
  ['look-30', 'Ankara Boubou Gown', 'Dresses', 'A flowing print gown with generous sleeves and relaxed movement.', 'photo-1539109136881-3be0616acf4b', 'WEST AFRICAN'],
  ['look-31', 'Igbo George Wrapper Set', 'Traditional', 'An Igbo-inspired blouse and George wrapper for a special occasion.', 'photo-1612722432474-b971cdcea546', 'IGBO'],
  ['look-32', 'Isi Agu Inspired Blouse', 'Tops', 'A contemporary blouse idea inspired by Igbo isi agu textile motifs.', 'photo-1551163943-3f6a855d1153', 'IGBO'],
  ['look-33', 'Igbo Maiden Wrapper Look', 'Traditional', 'A celebratory Igbo wrapper and blouse concept with bead-inspired details.', 'photo-1523398002811-999ca8dec234', 'IGBO'],
  ['look-34', 'Igbo Lace Occasion Gown', 'Dresses', 'A fitted lace gown concept for an Igbo wedding or family celebration.', 'photo-1595777457583-95e059d581b8', 'IGBO'],
  ['look-35', 'Hausa Atamfa Wrapper Set', 'Traditional', 'A northern Nigerian atamfa wrapper and blouse pairing in rich colour.', 'photo-1529139574466-a303027c1d8b', 'HAUSA'],
  ['look-36', 'Hausa Embroidered Kaftan', 'Dresses', 'A modest northern Nigerian kaftan with delicate neckline embroidery.', 'photo-1534528741775-53994a69daeb', 'HAUSA'],
  ['look-37', 'Zani and Blouse Set', 'Traditional', 'A Hausa-inspired zani wrapper styled with a tailored blouse.', 'photo-1509631179647-0177331693ae', 'HAUSA'],
  ['look-38', 'Northern Modest Maxi Gown', 'Dresses', 'A full-length modest gown idea with graceful sleeves and soft drape.', 'photo-1483985988355-763728e1935b', 'NORTHERN NIGERIA'],
  ['look-39', 'Fulani Embroidered Gown', 'Dresses', 'A flowing gown idea with fine embroidery inspired by Fulani adornment.', 'photo-1539008835657-9e8e9680c956', 'FULANI'],
  ['look-40', 'Fulani Indigo Wrapper Set', 'Traditional', 'A northern-inspired indigo wrapper and blouse with a comfortable fit.', 'photo-1612722432474-b971cdcea546', 'FULANI'],
  ['look-41', 'Edo Coral Bead Gown', 'Dresses', 'A Benin-inspired ceremony gown styled with coral-bead details.', 'photo-1524504388940-b1c1722653e1', 'EDO / BENIN'],
  ['look-42', 'Benin Royal Wrapper Set', 'Traditional', 'A rich Edo-inspired blouse and wrapper concept for a grand event.', 'photo-1525507119028-ed4c629a60a3', 'EDO / BENIN'],
  ['look-43', 'Edo Beaded Blouse', 'Tops', 'A statement blouse idea inspired by Edo ceremonial beadwork.', 'photo-1551163943-3f6a855d1153', 'EDO / BENIN'],
  ['look-44', 'Efik Onyonyo Dress', 'Dresses', 'An Efik-inspired occasion dress with a full skirt and decorative trim.', 'photo-1595777457583-95e059d581b8', 'EFIK'],
  ['look-45', 'Ofod Ukod Anwang Set', 'Traditional', 'An Efik and Ibibio-inspired blouse, wrapper, and shoulder-cloth combination.', 'photo-1523398002811-999ca8dec234', 'EFIK / IBIBIO'],
  ['look-46', "Tiv A'nger Stripe Dress", 'Dresses', 'A dress concept inspired by the distinctive black-and-white Tiv A’nger cloth.', 'photo-1566174053879-31528523f8ae', 'TIV'],
  ['look-47', 'Tiv Woven Wrapper Skirt', 'Skirts', 'A woven-cloth-inspired skirt styled with a simple fitted blouse.', 'photo-1509631179647-0177331693ae', 'TIV'],
  ['look-48', 'Idoma Red and Black Set', 'Traditional', 'An Idoma-inspired wrapper and blouse using a bold red-and-black palette.', 'photo-1529139574466-a303027c1d8b', 'IDOMA'],
  ['look-49', 'Kalabari George Wrapper', 'Traditional', 'A Kalabari-inspired George wrapper and blouse for a ceremonial gathering.', 'photo-1524504388940-b1c1722653e1', 'IJAW / KALABARI'],
  ['look-50', 'Ijaw Beaded Celebration Gown', 'Dresses', 'A Niger Delta-inspired gown with layered, bead-ready styling.', 'photo-1539109136881-3be0616acf4b', 'IJAW'],
  ['look-51', 'Urhobo Blouse and Wrapper', 'Traditional', 'An Urhobo-inspired blouse and wrapper pairing with a polished silhouette.', 'photo-1525507119028-ed4c629a60a3', 'URHOBO'],
  ['look-52', 'Isoko George Wrapper Skirt', 'Skirts', 'A statement wrapper skirt inspired by Isoko celebration dressing.', 'photo-1612722432474-b971cdcea546', 'ISOKO'],
  ['look-53', 'Itsekiri Ceremonial Set', 'Traditional', 'An Itsekiri-inspired blouse and wrapper for a formal family occasion.', 'photo-1591047139829-d91aecb6caea', 'ITSEKIRI'],
  ['look-54', 'Nupe Embroidered Kaftan', 'Dresses', 'A modest kaftan idea with embroidery inspired by Nupe craft traditions.', 'photo-1534528741775-53994a69daeb', 'NUPE'],
  ['look-55', 'Igala Woven Wrapper Dress', 'Dresses', 'An Igala-inspired wrapper dress with a woven-textile accent.', 'photo-1595777457583-95e059d581b8', 'IGALA'],
  ['look-56', 'Ebira Handwoven Skirt Set', 'Sets', 'A blouse and skirt concept inspired by Ebira woven cloth.', 'photo-1509631179647-0177331693ae', 'EBIRA'],
  ['look-57', 'Gbagyi Woven Wrap Gown', 'Dresses', 'A contemporary wrap gown concept with a Gbagyi-inspired woven accent.', 'photo-1566174053879-31528523f8ae', 'GBAGYI'],
  ['look-58', 'Kanuri Embroidered Modest Gown', 'Dresses', 'A full-length gown idea with embroidery and relaxed, modest tailoring.', 'photo-1483985988355-763728e1935b', 'KANURI']
].map(([id, name, category, description, image, label]) => ({ id, name, category, description, image, label }));

function showMessage(message, kind = '') {
  authMessage.textContent = message;
  authMessage.className = `auth-message ${kind}`;
}
function setMode(mode) {
  authMode = mode;
  const signup = mode === 'signup';
  document.querySelector('#loginTab').classList.toggle('selected', !signup);
  document.querySelector('#signupTab').classList.toggle('selected', signup);
  document.querySelector('#loginTab').setAttribute('aria-selected', String(!signup));
  document.querySelector('#signupTab').setAttribute('aria-selected', String(signup));
  nameGroup.hidden = !signup;
  nameInput.required = signup;
  passwordInput.autocomplete = signup ? 'new-password' : 'current-password';
  document.querySelector('#authEyebrow').textContent = signup ? 'A LITTLE SPACE OF YOUR OWN' : 'WELCOME BACK';
  document.querySelector('#authHeading').innerHTML = signup ? 'Make room for<br />your next idea.' : 'Good to see<br />you again.';
  document.querySelector('#authIntro').textContent = signup ? 'Create your account and start collecting the pieces you love.' : "Sign in to find the piece you can't wait to make.";
  authSubmit.firstElementChild.textContent = signup ? 'Create your account' : 'Log in to your studio';
  showMessage('');
}

document.querySelector('#loginTab').addEventListener('click', () => setMode('login'));
document.querySelector('#signupTab').addEventListener('click', () => setMode('signup'));
document.querySelector('#passwordToggle').addEventListener('click', event => {
  const show = passwordInput.type === 'password';
  passwordInput.type = show ? 'text' : 'password';
  event.currentTarget.textContent = show ? 'Hide' : 'Show';
  event.currentTarget.setAttribute('aria-label', show ? 'Hide password' : 'Show password');
});

authForm.addEventListener('submit', async event => {
  event.preventDefault();
  showMessage('');
  if (!authForm.reportValidity()) return;
  if (passwordInput.value.length < 6) {
    showMessage('Use at least 6 characters for your password.', 'error');
    return;
  }
  authSubmit.disabled = true;
  authSubmit.firstElementChild.textContent = authMode === 'signup' ? 'Creating your account…' : 'Signing you in…';
  const email = emailInput.value.trim();
  const password = passwordInput.value;
  try {
    const result = authMode === 'signup'
      ? await supabase.auth.signUp({ email, password, options: { data: { full_name: nameInput.value.trim() } } })
      : await supabase.auth.signInWithPassword({ email, password });
    if (result.error) throw result.error;
    if (authMode === 'signup' && !result.data.session) {
      showMessage('Check your email for a confirmation link, then come back here to log in.', 'success');
    } else if (result.data.user) {
      await showStudio(result.data.user);
    }
  } catch (error) {
    showMessage(friendlyAuthError(error), 'error');
  } finally {
    authSubmit.disabled = false;
    authSubmit.firstElementChild.textContent = authMode === 'signup' ? 'Create your account' : 'Log in to your studio';
  }
});

function friendlyAuthError(error) {
  const message = error?.message ?? 'Please try again.';
  if (/email rate limit exceeded|rate limit.*email|email.*rate limit/i.test(message)) {
    return 'Supabase has temporarily limited confirmation emails. Wait before trying again, or ask the site owner to configure custom SMTP in Supabase Authentication settings.';
  }
  if (/invalid login credentials/i.test(message)) return 'Email or password is incorrect. Check both and try again.';
  if (/already registered/i.test(message)) return 'That email already has an account. Try logging in instead.';
  if (/password should be at least/i.test(message)) return 'Use a longer password and try again.';
  return message;
}

async function showStudio(user) {
  activeUser = user;
  const name = user.user_metadata?.full_name?.trim() || user.email.split('@')[0];
  document.querySelector('#welcomeMessage').textContent = `Welcome in, ${name.split(' ')[0]}`;
  document.querySelector('#profileName').textContent = name.split(' ')[0];
  document.querySelector('#profileInitial').textContent = name.charAt(0).toUpperCase();
  document.querySelector('#profileEmail').textContent = user.email;
  document.querySelector('#authView').hidden = true;
  document.querySelector('#studioView').hidden = false;
  const [staffResult, picksResult] = await Promise.all([
    supabase.from('fashion_staff').select('role').eq('user_id', user.id).maybeSingle(),
    supabase.from('fashion_picks').select('design_id').eq('user_id', user.id)
  ]);
  isStaff = Boolean(staffResult.data);
  savedDesignIds = new Set((picksResult.data ?? []).map(pick => pick.design_id));
  document.querySelector('#clientPicksNav').hidden = !isStaff;
  document.querySelector('#clientPicksView').hidden = true;
  document.querySelector('#browseView').hidden = false;
  if (picksResult.error) showToast('Could not load your saved picks. Please refresh and try again.');
  renderFilters();
  renderDesigns();
}

document.querySelector('#profileButton').addEventListener('click', () => {
  const menu = document.querySelector('#profileMenu');
  menu.hidden = !menu.hidden;
});
document.addEventListener('click', event => {
  if (!event.target.closest('.header-actions')) document.querySelector('#profileMenu').hidden = true;
});
document.querySelector('#logoutButton').addEventListener('click', async () => {
  const { error } = await supabase.auth.signOut();
  if (error) showToast(error.message);
  document.querySelector('#profileMenu').hidden = true;
});

function renderFilters() {
  document.querySelector('#filters').innerHTML = categories.map(category => `<button type="button" class="filter${category === activeCategory ? ' active' : ''}" data-category="${category}" aria-pressed="${category === activeCategory}">${category}</button>`).join('');
  document.querySelectorAll('[data-category]').forEach(button => button.addEventListener('click', () => {
    activeCategory = button.dataset.category;
    renderFilters();
    renderDesigns();
  }));
}
function renderDesigns() {
  if (!activeUser) return;
  const visible = designs.filter(item => (activeCategory === 'All pieces' || item.category === activeCategory)
    && (!savedOnly || savedDesignIds.has(item.id))
    && `${item.name} ${item.category} ${item.description} ${item.label}`.toLowerCase().includes(searchTerm));
  document.querySelector('#resultCount').textContent = `${String(visible.length).padStart(2, '0')} ${savedOnly ? 'SAVED PIECES' : 'PIECES'}`;
  document.querySelector('#savedCount').textContent = savedDesignIds.size;
  document.querySelector('#designGrid').innerHTML = visible.map((item, index) => {
    const isSaved = savedDesignIds.has(item.id);
    return `<article class="design-card" style="animation-delay:${Math.min(index * 45, 330)}ms"><div class="design-image-wrap"><img class="design-image" src="https://images.unsplash.com/${item.image}?auto=format&fit=crop&w=720&q=80" alt="${item.name} fashion inspiration" loading="lazy" /><span class="design-number">NO. ${String(index + 1).padStart(2, '0')}</span><button class="save-button${isSaved ? ' saved' : ''}" type="button" data-save="${item.id}" aria-label="${isSaved ? 'Remove' : 'Save'} ${item.name}" aria-pressed="${isSaved}">${isSaved ? '♥' : '♡'}</button></div><div class="design-meta"><h3>${item.name}</h3><span>${item.label}</span></div><p class="design-description">${item.description}</p></article>`;
  }).join('');
  document.querySelector('#designGrid').hidden = visible.length === 0;
  document.querySelector('#emptyState').hidden = visible.length !== 0;
  document.querySelectorAll('[data-save]').forEach(button => button.addEventListener('click', () => toggleSaved(button.dataset.save)));
}
async function toggleSaved(id) {
  const item = designs.find(design => design.id === id);
  try {
    if (savedDesignIds.has(id)) {
      const { error } = await supabase.from('fashion_picks')
        .delete()
        .eq('user_id', activeUser.id)
        .eq('design_id', id);
      if (error) throw error;
      savedDesignIds.delete(id);
      showToast(`${item.name} removed from your picks`);
    } else {
      const { error } = await supabase.from('fashion_picks').insert({
        user_id: activeUser.id,
        customer_email: activeUser.email.toLowerCase(),
        customer_name: activeUser.user_metadata?.full_name?.trim() || activeUser.email.split('@')[0],
        design_id: item.id,
        design_name: item.name,
        category: item.category,
        image_id: item.image
      });
      if (error) throw error;
      savedDesignIds.add(id);
      showToast(`${item.name} saved and shared with the studio`);
    }
    renderDesigns();
  } catch (error) {
    showToast(error.code === '42P01' || error.code === 'PGRST205'
      ? 'Shared picks are not set up yet. Ask the studio owner to run the Supabase picks setup.'
      : 'Could not sync this pick. Please try again.');
  }
}

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, character => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[character]);
}

async function loadClientPicks() {
  if (!isStaff) return;
  const state = document.querySelector('#clientPicksState');
  const grid = document.querySelector('#clientPicksGrid');
  state.textContent = 'Loading customer picks…';
  grid.innerHTML = '';
  const { data, error } = await supabase.from('fashion_picks')
    .select('id, customer_email, customer_name, design_name, category, image_id, created_at')
    .order('created_at', { ascending: false });
  if (error) {
    state.textContent = 'Could not load customer picks. Check the shared-picks setup and staff access.';
    return;
  }
  if (!data.length) {
    state.textContent = 'No customer picks yet. Saved designs will appear here.';
    return;
  }
  state.textContent = `${data.length} PICK${data.length === 1 ? '' : 'S'} FROM CUSTOMERS`;
  grid.innerHTML = data.map(pick => `<article class="customer-pick"><img src="https://images.unsplash.com/${encodeURIComponent(pick.image_id)}?auto=format&fit=crop&w=520&q=75" alt="${escapeHtml(pick.design_name)}" loading="lazy" /><div class="customer-pick-details"><p class="eyebrow">${escapeHtml(pick.category)}</p><h3>${escapeHtml(pick.design_name)}</h3><p>${escapeHtml(pick.customer_name)}</p><a href="mailto:${encodeURIComponent(pick.customer_email)}">${escapeHtml(pick.customer_email)}</a><time datetime="${escapeHtml(pick.created_at)}">${new Date(pick.created_at).toLocaleDateString()}</time></div></article>`).join('');
}
function showToast(message) {
  const toast = document.querySelector('#toast');
  toast.textContent = message;
  toast.classList.add('visible');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('visible'), 2200);
}

function updateOnlineImageSearch(query) {
  const link = document.querySelector('#onlineImageSearch');
  const cleanedQuery = query.trim();
  link.hidden = cleanedQuery.length === 0;
  link.href = `https://www.google.com/search?tbm=isch&q=${encodeURIComponent(`${cleanedQuery} Nigerian traditional dress fashion`)}`;
}

document.querySelector('#searchInput').addEventListener('input', event => {
  searchTerm = event.target.value.trim().toLowerCase();
  updateOnlineImageSearch(event.target.value);
  renderDesigns();
});
document.querySelector('#clearFilters').addEventListener('click', () => {
  activeCategory = 'All pieces';
  savedOnly = false;
  searchTerm = '';
  document.querySelector('#searchInput').value = '';
  updateOnlineImageSearch('');
  document.querySelector('#discoverNav').classList.add('active');
  document.querySelector('#savedNav').classList.remove('active');
  renderFilters();
  renderDesigns();
});
document.querySelector('#discoverNav').addEventListener('click', () => {
  savedOnly = false;
  document.querySelector('#browseView').hidden = false;
  document.querySelector('#clientPicksView').hidden = true;
  document.querySelector('#discoverNav').classList.add('active');
  document.querySelector('#savedNav').classList.remove('active');
  document.querySelector('#clientPicksNav').classList.remove('active');
  renderFilters();
  renderDesigns();
});
document.querySelector('#savedNav').addEventListener('click', () => {
  savedOnly = true;
  activeCategory = 'All pieces';
  document.querySelector('#browseView').hidden = false;
  document.querySelector('#clientPicksView').hidden = true;
  document.querySelector('#savedNav').classList.add('active');
  document.querySelector('#discoverNav').classList.remove('active');
  document.querySelector('#clientPicksNav').classList.remove('active');
  renderFilters();
  renderDesigns();
});
document.querySelector('#clientPicksNav').addEventListener('click', event => {
  event.preventDefault();
  if (!isStaff) return;
  document.querySelector('#browseView').hidden = true;
  document.querySelector('#clientPicksView').hidden = false;
  document.querySelector('#discoverNav').classList.remove('active');
  document.querySelector('#savedNav').classList.remove('active');
  event.currentTarget.classList.add('active');
  loadClientPicks();
});
document.querySelector('#refreshClientPicks').addEventListener('click', loadClientPicks);
document.addEventListener('keydown', event => {
  if (event.key === '/' && !['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) {
    event.preventDefault();
    document.querySelector('#searchInput').focus();
  }
  if (event.key === 'Escape') document.querySelector('#profileMenu').hidden = true;
});

if (configured) {
  try {
    supabase = createClient(config.url, config.anonKey);
    authSubmit.disabled = false;
    supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session?.user) showStudio(session.user);
      if (event === 'SIGNED_OUT') {
        activeUser = null;
        document.querySelector('#studioView').hidden = true;
        document.querySelector('#authView').hidden = false;
        authForm.reset();
        setMode('login');
      }
    });
    supabase.auth.getSession().then(({ data, error }) => {
      if (error) showMessage(error.message, 'error');
      else if (data.session?.user) showStudio(data.session.user);
    });
  } catch (error) {
    showMessage(`Supabase could not start: ${error.message}`, 'error');
  }
} else {
  showMessage('Connect your Supabase project in supabase-config.js to enable real account sign-in.', 'setup');
}