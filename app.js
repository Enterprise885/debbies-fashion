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
  ['look-26', 'Lagos After Dark', 'Evening', 'A confident evening silhouette, tailored to your occasion.', 'photo-1539109136881-3be0616acf4b', 'AFTER HOURS']
].map(([id, name, category, description, image, label]) => ({ id, name, category, description, image, label }));

function savedKey() { return `debbiesFashionSaved:${activeUser.id}`; }
function readSaved() {
  try { return JSON.parse(localStorage.getItem(savedKey())) ?? []; } catch { return []; }
}
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
  const saved = readSaved();
  const visible = designs.filter(item => (activeCategory === 'All pieces' || item.category === activeCategory)
    && (!savedOnly || saved.includes(item.id))
    && `${item.name} ${item.category} ${item.description} ${item.label}`.toLowerCase().includes(searchTerm));
  document.querySelector('#resultCount').textContent = `${String(visible.length).padStart(2, '0')} ${savedOnly ? 'SAVED PIECES' : 'PIECES'}`;
  document.querySelector('#savedCount').textContent = saved.length;
  document.querySelector('#designGrid').innerHTML = visible.map((item, index) => {
    const isSaved = saved.includes(item.id);
    return `<article class="design-card" style="animation-delay:${Math.min(index * 45, 330)}ms"><div class="design-image-wrap"><img class="design-image" src="https://images.unsplash.com/${item.image}?auto=format&fit=crop&w=720&q=80" alt="${item.name} fashion inspiration" loading="lazy" /><span class="design-number">NO. ${String(index + 1).padStart(2, '0')}</span><button class="save-button${isSaved ? ' saved' : ''}" type="button" data-save="${item.id}" aria-label="${isSaved ? 'Remove' : 'Save'} ${item.name}" aria-pressed="${isSaved}">${isSaved ? '♥' : '♡'}</button></div><div class="design-meta"><h3>${item.name}</h3><span>${item.label}</span></div><p class="design-description">${item.description}</p></article>`;
  }).join('');
  document.querySelector('#designGrid').hidden = visible.length === 0;
  document.querySelector('#emptyState').hidden = visible.length !== 0;
  document.querySelectorAll('[data-save]').forEach(button => button.addEventListener('click', () => toggleSaved(button.dataset.save)));
}
function toggleSaved(id) {
  const saved = readSaved();
  const index = saved.indexOf(id);
  const item = designs.find(design => design.id === id);
  if (index < 0) {
    saved.push(id);
    showToast(`${item.name} saved to your picks`);
  } else {
    saved.splice(index, 1);
    showToast(`${item.name} removed from your picks`);
  }
  localStorage.setItem(savedKey(), JSON.stringify(saved));
  renderDesigns();
}
function showToast(message) {
  const toast = document.querySelector('#toast');
  toast.textContent = message;
  toast.classList.add('visible');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('visible'), 2200);
}

document.querySelector('#searchInput').addEventListener('input', event => {
  searchTerm = event.target.value.trim().toLowerCase();
  renderDesigns();
});
document.querySelector('#clearFilters').addEventListener('click', () => {
  activeCategory = 'All pieces';
  savedOnly = false;
  searchTerm = '';
  document.querySelector('#searchInput').value = '';
  document.querySelector('#discoverNav').classList.add('active');
  document.querySelector('#savedNav').classList.remove('active');
  renderFilters();
  renderDesigns();
});
document.querySelector('#discoverNav').addEventListener('click', () => {
  savedOnly = false;
  document.querySelector('#discoverNav').classList.add('active');
  document.querySelector('#savedNav').classList.remove('active');
  renderFilters();
  renderDesigns();
});
document.querySelector('#savedNav').addEventListener('click', () => {
  savedOnly = true;
  activeCategory = 'All pieces';
  document.querySelector('#savedNav').classList.add('active');
  document.querySelector('#discoverNav').classList.remove('active');
  renderFilters();
  renderDesigns();
});
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