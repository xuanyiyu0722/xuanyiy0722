/* Original High-Fi artwork and flow adapted from Alicia's Figma Design / Make.
   State stays in memory. This is a portfolio prototype, not an ordering service. */
(() => {
  'use strict';
  const root = document.querySelector('[data-hf-experience]');
  if (!root) return;
  const asset = '../assets/images/naborfood-highfi/';
  const escape = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const art = name => `${asset}${name}`;
  const product = (name,image,protein,kcal,price,tag) => ({name,image,protein,kcal,price,tag});
  // Catalog values and images come from the original High-Fi screens.
  const products = [
    product('Dark Chocolate Crunch','f2e0f.webp',24,210,4.50,'Bestseller'),
    product('Matcha Pistachio','c3d4c.webp',22,195,4.75,'New Release'),
    product('White Chocolate Vanilla','1671b.webp',21,200,4.25,'Classic'),
    product('Peanut Butter Power','7411b.webp',25,225,4.50,'Bestseller'),
    product('Honey Oat','69388.webp',18,190,4.00,'Classic'),
    product('Strawberry','9d4d9.webp',23,205,4.50,'Seasonal'),
    product('Coconut Cacao','445d1.webp',20,215,4.75,'Seasonal'),
    product('Banana Walnut','bc15d.webp',19,198,4.25,'New Release'),
    product('Strawberry Yogurt','785b3.webp',20,185,4.50,'High Protein'),
    product('Blueberry Oat','785b3.webp',18,188,4.25,'Low Sugar'),
    product('Espresso Mocha','707e2.webp',22,220,4.75,'New Release'),
    product('Cinnamon Roll','bc15d.webp',21,212,4.50,'Classic')
  ];
  const recipes = [
    {name:'Chen’s Dark Recovery',base:'Dark Chocolate',protein:'Whey',mix:'Almond',coating:'Dark 70%'},
    {name:'Matcha Morning',base:'Matcha',protein:'Plant',mix:'Cacao Nibs',coating:'White Chocolate'},
    {name:'Coffee Boost',base:'Coffee',protein:'Whey',mix:'Walnut',coating:'Dark 85%'}
  ];
  const layers = [
    {key:'base',label:'base flavor',options:['Dark Chocolate','Matcha','Vanilla','Oat','Peanut Butter','Almond','Coconut','Banana','Strawberry','Blueberry','Coffee','Cinnamon']},
    {key:'protein',label:'protein source',options:['Whey','Plant','Casein','Egg White']},
    {key:'mix',label:'mix-ins',options:['Almond','Walnut','Cashew','Peanut','Pecan','Pumpkin Seed','Chia','Granola','Cacao Nibs','Pretzel']},
    {key:'coating',label:'chocolate coating',options:['Dark 50%','Dark 70%','Dark 85%','Dark 90%','Milk Chocolate','Mint Chocolate','White Chocolate']}
  ];
  const machines = ['Level 2 Union Building','Library Ground Floor','Gym Entrance'];
  const stories = {
    app: [
      {key:'explore',title:'Explore',screen:'home',heading:'Explore our protein bar products.',copy:'Users can first encounter NABORFOOD through online promotion that leads them to the app.',hint:'Browse Discover, explore a product, or order the recommendation on Home.'},
      {key:'customize',title:'Customize',screen:'builder',heading:'Build your protein bar.',copy:'Try our customization function. Use AI, or manually build your bar.',hint:'Load a saved recipe, try a suggested prompt, or select “Build a new one” to choose each layer.'},
      {key:'purchase',title:'Purchase',screen:'checkout',heading:'Choose how to receive it.',copy:'Pay and choose your delivery method. You’ll find a QR code in History.',hint:'Choose a pickup location or delivery, adjust the quantity, and place a prototype order.'},
      {key:'pickup',title:'Pickup',screen:'history',heading:'Scan. Pick up. Enjoy.',copy:'Scan the code on the machine. Pick up your protein bar. Please enjoy!',hint:'Open the upcoming pickup to see its QR code, then try the pickup interaction.'},
      {key:'engagement',title:'Membership',screen:'profile',heading:'Make it an everyday habit.',copy:'The Profile page supports long-term engagement. Users can join the membership, earn points, track fitness and nutrition goals, and access personalized benefits. This turns repeated purchases into a consistent daily habit.',hint:'Explore points, fitness goals, and saved recipes from Profile.'}
    ],
    station: [
      {key:'login',title:'Log in',screen:'login',heading:'Meet NABORFOOD on the go.',copy:'Scan the landing screen QR code to log in. Users can also start with an offline encounter at a NABORFOOD vending machine.',hint:'Tap the QR code to try member access, or continue as a guest for a quick purchase.'},
      {key:'explore',title:'Explore',screen:'catalog',heading:'A quick route to your flavor.',copy:'The explore section on our vending machine is very similar to what we have on the app. Logging in unlocks more functions.',hint:'Filter the flavors and add a bar. Members can view AI recommendations; Custom Build connects to the app.'},
      {key:'purchase',title:'Purchase & Pickup',screen:'checkout',heading:'Confirm, pay, and pick up.',copy:'Confirm the product, place the order, pay the bill, and pick up your bar!',hint:'Review your selected bars and complete the prototype purchase. No payment is processed.'}
    ]
  };
  let device = 'app';
  let screen = 'home';
  let stage = 0;
  let layer = 0;
  let selected = 0;
  let recipe = {...recipes[0]};
  let custom = false;
  let quantity = 1;
  let method = 'Pickup';
  let machine = 2;
  let guest = true;
  let category = 'All Flavors';
  let cart = new Map();
  let order = null;
  let collected = false;
  let prompt = '';
  let notice = '';
  let noticeTimer;
  const money = n => `$${n.toFixed(2)}`;
  const btn = (text,action,value='',className='hf-primary',extra='') => `<button type="button" class="${className}" data-hf-action="${action}" data-value="${escape(value)}" ${extra}>${text}</button>`;
  const icon = (file,alt='') => `<img src="${art(file)}" alt="${escape(alt)}" loading="lazy" decoding="async">`;
  const qr = () => `<span class="hf-qr" aria-hidden="true">${icon('pickup-qr.svg')}</span>`;
  const eyebrow = text => `<span class="hf-eyebrow">${text}</span>`;
  const currentItem = () => custom ? {name:`Custom ${recipe.base} Bar`,image:recipe.base === 'Matcha'?'c3d4c.webp':recipe.base === 'Coffee'?'707e2.webp':'f2e0f.webp',protein:24,kcal:220,price:4.90} : products[selected];
  const nutrition = (item=currentItem()) => `<div class="hf-nutrition"><span><strong>${item.protein}g</strong><small>Protein</small></span><span><strong>${item.kcal}</strong><small>Kcal</small></span><span><strong>${money(item.price)}</strong><small>Price</small></span></div>`;
  const workout = () => `<div class="hf-dark">${eyebrow(device==='app'?'Today’s Workout · Synced':'Your workout summary')}<div class="hf-workout"><span><strong>142</strong><small>AVG BPM</small></span><span><strong>450</strong><small>KCAL</small></span><span><strong>${device==='app'?52:45}</strong><small>MINS</small></span></div></div>`;
  const title = (text,back='') => `<div class="hf-title-row">${back ? btn('‹', 'screen', back, 'hf-icon-button', 'aria-label="Go back"') : ''}<h3>${text}</h3></div>`;
  const recipeText = () => `${escape(recipe.base)} · ${escape(recipe.protein)} · ${escape(recipe.mix)} · ${escape(recipe.coating)}`;
  function flash(message) {
    notice = message;
    clearTimeout(noticeTimer);
    const box = root.querySelector('[data-hf-notice]');
    if (box) box.textContent = message;
    noticeTimer = setTimeout(() => {notice=''; const box=root.querySelector('[data-hf-notice]'); if(box) box.textContent='';}, 3000);
  }
  function nav() {
    const active = ['builder','custom'].includes(screen)?'builder':['detail'].includes(screen)?'discover':['pickup','collected'].includes(screen)?'history':screen;
    const navs = [['home','d208c.svg','Home'],['builder','2fc7c.svg','Order & Build'],['discover','d12f4.svg','Discover'],['history','c3b33.svg','History'],['profile','46f7c.svg','Profile']];
    return `<nav class="hf-nav" aria-label="Prototype app navigation">${navs.map(([key,file,label]) => btn(`${icon(file)}<span>${label}</span>`,'screen',key,active===key?'is-active':'',active===key?'aria-current="page"':'')).join('')}</nav>`;
  }
  function phone(content) {
    return `<div class="hf-ui hf-phone" aria-label="Interactive NABORFOOD High-Fidelity app"><div class="hf-status"><span>9:41</span><span class="hf-status-icons">${icon('6c685.svg')}${icon('b1377.svg')}${icon('8e6ba.svg')}</span></div><header class="hf-brandbar"><span class="hf-wordmark">NABORFOOD</span><span class="hf-brand-actions">${btn(icon('a537a.svg'),'scan','','hf-icon-button','aria-label="Scan a vending machine" style="background:#111;border-radius:50%;padding:3px"')}${btn('SK','screen','profile','hf-avatar','aria-label="Open profile"')}</span></header><div class="hf-scroll" tabindex="0" aria-label="App screen; scroll for more">${content}</div>${screen==='builder'?`<div class="hf-recipe-footer">${nutrition({protein:24,kcal:220,price:4.90})}<div class="hf-recipe-actions">${btn('Save recipe','save','','hf-secondary')}${btn('Order this recipe','recipe-order','','hf-primary green')}</div></div>`:''}${nav()}<div class="hf-notice" data-hf-notice role="status">${escape(notice)}</div></div>`;
  }
  function card(p,i,kiosk=false) {
    return `<article class="hf-product"><button type="button" class="hf-product-picture" data-hf-action="${kiosk?'add':'detail'}" data-value="${i}" aria-label="${kiosk?'Add':'Explore'} ${escape(p.name)}">${icon(p.image,p.name)}<span class="hf-badge">${p.tag}</span></button><div class="hf-product-copy"><h4>${p.name}</h4><p>${p.protein}g protein · ${p.kcal} kcal</p><div class="hf-product-bottom">${kiosk?`<span>${money(p.price)}</span>${btn('Add','add',i,'hf-primary',`aria-label="Add ${escape(p.name)} to cart"`)}`:`${btn('Explore','detail',i,'')}${btn('+','quick-order',i,'hf-cart-add',`aria-label="Order ${escape(p.name)}"`)}`}</div></div></article>`;
  }
  function home() {
    return `${eyebrow('Wednesday · Jul 1')}<h3 style="font-size:30px;margin-bottom:17px">Hi, Sarah</h3>${workout()}<article class="hf-recommend">${eyebrow('AI recommendation · 96% match')}${icon(products[0].image,'Dark Chocolate Crunch')}<h4>Dark Chocolate</h4><p class="hf-small">24g protein · 210 kcal · Matches your recovery goal</p>${btn('Order Now →','quick-order',0,'hf-primary hf-full')}</article><div class="hf-space">${eyebrow('Nearby vending machines')}${machines.map((m,i)=>btn(`<span>${m}<small>${[12,8,24][i]} bars available · ${['0.1','0.3','0.5'][i]} mi</small></span><span>↗</span>`,'nearby',i,'hf-location')).join('')}</div>`;
  }
  function discover() {
    return `<div class="hf-rising">${icon('37218.webp','Vanilla Almond')}<div>${eyebrow('Rising · +240% this week')}<p>Vanilla Almond</p><small>3,100 people added it recently</small></div></div>${eyebrow('All products · 12 flavors')}<div class="hf-product-grid">${products.map((p,i)=>card(p,i)).join('')}</div>`;
  }
  function detail() {
    const p=products[selected];
    return `${title('Explore flavor','discover')}${icon(p.image,p.name).replace('<img ','<img class="hf-detail-art" ')}${eyebrow(p.tag)}<h3>${p.name}</h3><p class="hf-small hf-space">${p.protein}g protein · ${p.kcal} kcal</p>${nutrition(p)}${btn('Order this bar →','quick-order',selected,'hf-primary hf-full')}<div class="hf-space">${btn('Create your own flavor','screen','builder','hf-secondary hf-full')}</div>`;
  }
  function builder() {
    return `${title('✦ AI Recipe Builder')}${eyebrow('Saved recipes · tap to load')}<div class="hf-saved">${recipes.map((r,i)=>btn(`<strong>${escape(r.name)}</strong><small>${escape(r.base)} · ${escape(r.protein)} · ${escape(r.mix)}</small><em>Load</em>`,'load',i,'')).join('')}</div><div class="hf-generator">${eyebrow('AI recipe generator')}<textarea aria-label="Describe your protein bar" data-hf-prompt placeholder="e.g. Make me a bar for post-workout recovery with high protein…">${escape(prompt)}</textarea>${eyebrow('Suggested prompts')}<div class="hf-prompts">${btn('“High protein for muscle gain”','prompt','High protein for muscle gain','')}${btn('“Low calorie evening snack”','prompt','Low calorie evening snack','')}</div>${btn('GENERATE PERSONALIZED RECIPE','generate','','hf-primary hf-full')}</div>${btn('<span>Build a new one<small>Design your bar layer by layer</small></span><span>→</span>','build','','hf-build-link')}<div class="hf-space">${eyebrow('Your current recipe')}<p class="hf-recipe-summary">${recipeText()}</p></div>`;
  }
  function customBuilder() {
    const part=layers[layer];
    const baseColors={'Dark Chocolate':'#60402c',Matcha:'#84a53c',Vanilla:'#e8dec7',Oat:'#d5bd8f','Peanut Butter':'#b6864b',Almond:'#bca284',Coconut:'#eee5d2',Banana:'#e5c454',Strawberry:'#d78185',Blueberry:'#8e86ac',Coffee:'#806046',Cinnamon:'#c39366'};
    const coatingColors={'Dark 50%':'#705035','Dark 70%':'#513729','Dark 85%':'#392a24','Dark 90%':'#291e1b','Milk Chocolate':'#9a7050','Mint Chocolate':'#617348','White Chocolate':'#e6deca'};
    return `${title('Build a new one','builder')}<div class="hf-custom-progress" aria-label="Step ${layer+1} of 4">${layers.map((_,i)=>`<i class="${i===layer?'active':''}"></i>`).join('')}</div><div class="hf-layer-preview"><div class="hf-layer-bar" aria-label="Your bar layers"><span style="background:${coatingColors[recipe.coating]}"></span><span style="background:#b58c57"></span><span style="background:${recipe.protein==='Plant'?'#d9dab7':'#e7dcc5'}"></span><span style="background:${baseColors[recipe.base]}"></span></div><div>${eyebrow(`Step ${layer+1} of 4`)}<p>Choose your ${part.label}</p><small>Current: ${escape(recipe[part.key])}</small></div></div><div class="hf-choice-grid">${part.options.map(option=>btn(escape(option),'choose',option,'',`aria-pressed="${recipe[part.key]===option}"`)).join('')}</div><div class="hf-custom-footer">${btn('Prev','layer',layer-1,'hf-secondary',layer===0?'disabled':'')}${btn(layer===3?'Done':'Next →',layer===3?'finish-build':'layer',layer+1,'hf-primary')}</div>`;
  }
  function quantityControl(value,key='quantity',id='') {
    return `<div class="hf-quantity" aria-label="Quantity">${btn('−',key,`${id}${id!==''?':':''}-1`,'',value<=1?'disabled aria-label="Decrease quantity"':'aria-label="Decrease quantity"')}<span>${value}</span>${btn('+',key,`${id}${id!==''?':':''}1`,'',value>=9?'disabled aria-label="Increase quantity"':'aria-label="Increase quantity"')}</div>`;
  }
  function checkout() {
    const p=currentItem();
    return `${title('Checkout',custom?'builder':'discover')}<div class="hf-checkout-product">${icon(p.image,p.name)}<div><h4>${escape(p.name)}</h4><p class="hf-tiny">${p.protein}g protein · ${money(p.price)}</p>${quantityControl(quantity)}</div></div>${eyebrow('How would you like it?')}<div class="hf-delivery">${['Pickup','Delivery'].map(m=>btn(`${m}<small>${m==='Pickup'?'Ready in 2 min':'15–20 min'}</small>`,'method',m,'',`aria-pressed="${method===m}"`)).join('')}</div><div class="hf-space">${method==='Pickup'?`${eyebrow('Pickup machine')}${machines.map((m,i)=>btn(`<span>${m}<small>${[12,8,24][i]} bars · ${['0.1','0.3','0.5'][i]} mi</small></span><span>${machine===i?'●':'○'}</span>`,'machine',i,'hf-location',`aria-pressed="${machine===i}"`)).join('')}`:`${eyebrow('Delivery')}<p class="hf-small">Delivery selected · 15–20 min</p><p class="hf-tiny" style="margin-top:7px">Sample delivery details from the prototype.</p>`}</div><div class="hf-space">${eyebrow('Payment')}<div class="hf-location"><span>Visa •••• 4291<small>Expires 08/27</small></span><span>●</span></div></div><div class="hf-total"><span>Total</span><strong>${money(p.price*quantity)}</strong></div>${btn(`Place ${method.toLowerCase()} order · ${money(p.price*quantity)}`,'place-app','','hf-primary hf-full')}`;
  }
  function history() {
    const item=order || {name:'Custom Matcha Bar',machine:0,method:'Pickup',quantity:1};
    const rows=[['Chocolate Fudge',0,'June 12 · 08:30 AM · Qty 2','Gym Entrance VM #1'],['Matcha Pistachio',1,'June 11 · 06:15 PM · Qty 1','Delivery'],['Vanilla Almond',2,'June 11 · 09:00 AM · Qty 3','Library Ground Floor VM #3'],['Strawberry',8,'June 09 · 05:30 PM · Qty 1','Delivery'],['Peanut Butter Power',3,'June 08 · 08:15 AM · Qty 4','Level 2 Union VM #2']];
    return `${title('Purchase History')}${btn(`<div>${eyebrow(collected?'Pickup complete':item.method==='Delivery'?'Delivery confirmed':'Upcoming pickup')}<h4>${escape(item.name)}</h4><small>${escape(item.method==='Delivery'?'Delivery · 15–20 min':machines[item.machine])}</small><small>${collected?'Enjoy your protein bar.':item.method==='Delivery'?'Order details':'Tap code to scan →'}</small></div>${qr()}`,'pickup','','hf-upcoming')}${rows.map(([name,i,date,location])=>`<div class="hf-history-row">${icon(products[i].image,'')}<div><strong>${name}</strong><small>${date}</small><small>${location}</small></div>${btn('↻ Reorder','quick-order',i,'')}</div>`).join('')}`;
  }
  function pickup() {
    const item=order||{name:'Custom Matcha Bar',machine:0,method:'Pickup'};
    if (item.method==='Delivery') return `${title('Order details','history')}<div class="hf-pickup"><div class="hf-success-icon">✓</div><h3>Order confirmed</h3><p class="hf-small hf-space">${escape(item.name)}</p><p class="hf-small">Delivery · 15–20 min</p>${btn('Back to History','screen','history','hf-secondary hf-full')}</div>`;
    return `${title('Pickup code','history')}<div class="hf-pickup">${eyebrow('Pick up your protein bar')}<h3>${escape(item.name)}</h3>${qr()}<p class="hf-small">Hold up to the machine scanner.</p><p class="hf-tiny">${escape(machines[item.machine])}</p>${btn('Try pickup →','collect-app','','hf-primary hf-full')}</div>`;
  }
  function collectedScreen() {
    return `${title('Pickup complete')}<div class="hf-pickup"><div class="hf-success-icon">✓</div><h3>Please enjoy!</h3><p class="hf-small hf-space">Your protein bar is ready.</p>${btn('Explore membership','screen','profile','hf-primary hf-full')}${btn('Back to History','screen','history','hf-secondary hf-full','style="margin-top:10px"')}</div>`;
  }
  function scanScreen() {
    return `${title('Scan vending machine','home')}<div class="hf-scanner"><span class="hf-eyebrow">Scan the machine QR code</span><div>${icon('a537a.svg')}</div><p>Point at the code on the machine.</p>${btn('Try scan →','scan-login','','hf-primary green hf-full')}</div>`;
  }
  function profile() {
    return `<div class="hf-member"><span>SK</span><div><h4>Sarah Kim</h4>${eyebrow('Gold member')}</div></div><div class="hf-dark hf-points">${eyebrow('Points balance')}<strong>2,340</strong><div class="hf-progress"><span style="width:78%"></span></div><p class="hf-tiny">660 pts to Platinum</p></div><div class="hf-space">${eyebrow('Fitness goal tracker')}<div class="hf-goal"><div><span>Weekly Protein Target</span><span>850g / 1000g</span></div><div class="hf-progress"><span style="width:85%"></span></div></div><div class="hf-goal"><div><span>Workouts Logged</span><span>4 / 5 days</span></div><div class="hf-progress"><span style="width:80%"></span></div></div></div><div class="hf-profile-links">${btn('Rewards & Achievements <span>›</span>','rewards','','')}${btn('Saved Recipes <span>›</span>','screen','builder','')}${btn('Purchase History <span>›</span>','screen','history','')}</div>`;
  }
  function kioskShell(content,mode='scroll') {
    return `<div class="hf-station-viewport"><div class="hf-ui hf-kiosk" aria-label="Interactive NABORFOOD High-Fidelity vending machine"><header class="hf-brandbar"><div class="hf-kiosk-brand"><span class="hf-wordmark">NABORFOOD</span><small>Smart vending console</small></div>${screen!=='login'?`<nav class="hf-kiosk-links" aria-label="Prototype machine navigation">${[['ai','AI Recommendation'],['catalog','All Flavors'],['station-custom','Custom Build']].filter(([key])=>!guest||key==='catalog').map(([key,label])=>btn(label,'screen',key,screen===key?'is-active':'',screen===key?'aria-current="page"':'')).join('')}</nav>`:'<span style="flex:1"></span>'}<span class="hf-machine-id">VM-042 · Level 2</span><span class="hf-machine-user">${guest?'Guest':'Sarah'}</span></header><div class="${mode==='scroll'?'hf-scroll':mode}" ${mode==='scroll'?'tabindex="0" aria-label="Machine screen; scroll for more"':''}>${content}</div>${['catalog','ai'].includes(screen)?cartBar():''}<div class="hf-notice" data-hf-notice role="status">${escape(notice)}</div></div></div>`;
  }
  const cartCount = () => [...cart.values()].reduce((sum,n)=>sum+n,0);
  const cartTotal = () => [...cart].reduce((sum,[i,n])=>sum+products[i].price*n,0);
  const cartBar = () => `<div class="hf-cart-bar"><span><strong>${money(cartTotal())}</strong> <small>· ${cartCount()} bars</small></span>${btn('Proceed to Checkout →','station-checkout','','hf-primary',cartCount()?'':'disabled')}</div>`;
  function login() {
    return kioskShell(`<div class="hf-kiosk-login"><div>${eyebrow('Welcome to')}<h3>NABORFOOD</h3><p>Log in with the app to unlock AI recommendations and Custom Build, or browse all flavors as a guest.</p>${btn('Continue as Guest →','guest','','hf-primary')}<p class="hf-tiny">Guests can buy any flavor directly. Custom Build requires login.</p></div>${btn(qr(),'login','','hf-login-qr','aria-label="Try member login with QR code"')}</div>`);
  }
  function catalog() {
    const categories=['All Flavors','High Protein','Low Sugar','New','Seasonal'];
    const show = products.map((p,i)=>({p,i})).filter(({p})=>category==='All Flavors'||category==='High Protein'&&p.tag==='High Protein'||category==='Low Sugar'&&p.tag==='Low Sugar'||category==='New'&&p.tag==='New Release'||category==='Seasonal'&&p.tag==='Seasonal');
    return kioskShell(`<aside class="hf-kiosk-categories">${eyebrow('Categories')}${categories.map(c=>btn(c,'category',c,'',`aria-pressed="${category===c}"`)).join('')}</aside><div class="hf-kiosk-products" tabindex="0" aria-label="Available protein bars; scroll for more">${eyebrow(`${category} · ${show.length} flavors`)}<div class="hf-product-grid">${show.map(({p,i})=>card(p,i,true)).join('')}</div></div>`,'hf-kiosk-catalog');
  }
  function ai() {
    return kioskShell(`${workout()}${eyebrow('✦ Recommended for you')}<div class="hf-product-grid hf-recommended-products">${products.slice(0,3).map((p,i)=>card(p,i,true)).join('')}</div><div class="hf-space">${btn('Explore All Flavors →','screen','catalog','hf-secondary')}</div>`);
  }
  function stationCustom() {
    return kioskShell(`<div class="hf-kiosk-custom">${eyebrow('More ways to make it yours')}<h3>Custom Build</h3><p>If you are a new user who starts your journey from our machine, this page leads you to download our app and try our Custom Build function.</p>${qr()}${btn('Continue in App →','open-app','','hf-primary')}</div>`);
  }
  function stationCheckout() {
    return kioskShell(`<div><span class="hf-eyebrow">Review order</span><h3>Your Bars</h3>${[...cart].map(([i,n])=>`<div class="hf-checkout-product">${icon(products[i].image,products[i].name)}<div><h4 style="font:11px Arial,sans-serif">${products[i].name}</h4><p class="hf-tiny">${money(products[i].price)} each</p></div>${quantityControl(n,'cart-quantity',i)}${btn('×','remove',i,'hf-icon-button',`aria-label="Remove ${products[i].name}"`)}</div>`).join('')}${btn('← Keep exploring','screen','catalog','hf-secondary')}</div><div>${eyebrow('Order summary')}<p class="hf-small">Items <span style="float:right">${cartCount()} bars</span></p><p class="hf-tiny" style="margin-top:8px">Pickup <span style="float:right">VM-042 · now</span></p><div class="hf-total"><span>Total</span><strong>${money(cartTotal())}</strong></div>${btn(`Place Order · ${money(cartTotal())}`,'place-station','','hf-primary hf-full',cartCount()?'':'disabled')}</div>`,'hf-kiosk-checkout');
  }
  function stationDone() {
    return kioskShell(`<div class="hf-pickup" style="padding-top:22px"><div class="hf-success-icon">✓</div><h3>Your protein bar is ready.</h3><p class="hf-small hf-space">Pick up your bar. Please enjoy!</p>${btn('Start another visit','reset-station','','hf-primary')}${btn('Explore the App →','open-app','','hf-secondary','style="margin-top:12px"')}</div>`);
  }
  function stageFor(next) {
    if (device==='station') return ['login'].includes(next)?0:['checkout','station-done'].includes(next)?2:1;
    if (['builder','custom'].includes(next)) return 1;
    if (next==='checkout') return 2;
    if (['history','pickup','collected'].includes(next)) return 3;
    if (next==='profile') return 4;
    return 0;
  }
  function setScreen(next) {
    screen=next;
    stage=stageFor(next);
    notice='';
    render();
    const target=root.querySelector('[data-hf-mount] h3, [data-hf-mount] button');
    if(target){if(target.tagName!=='BUTTON') target.tabIndex=-1;target.focus({preventScroll:true});}
  }
  function goStage(index) {
    stage=Math.max(0,Math.min(index,stories[device].length-1));
    const next=stories[device][stage].screen;
    if (device==='station'&&next==='checkout'&&!cart.size) cart.set(0,1);
    screen=next;
    notice='';
    render();
    root.querySelector('[data-hf-steps] [aria-current="step"]')?.focus({preventScroll:true});
  }
  // The original kiosk uses a 1190 × 842 screen. Resize only its presentation,
  // preserving the same interface geometry and clickable controls at every width.
  function fitStation() {
    const viewport = root.querySelector('.hf-station-viewport');
    if (viewport) viewport.style.setProperty('--hf-station-scale', String(viewport.getBoundingClientRect().width / 800));
  }
  const stationResize = new ResizeObserver(fitStation);
  stationResize.observe(root.querySelector('[data-hf-mount]'));
  function render() {
    const story=stories[device][stage];
    root.querySelectorAll('[data-hf-device]').forEach(b=>{b.setAttribute('aria-selected',String(b.dataset.hfDevice===device));b.tabIndex=b.dataset.hfDevice===device?0:-1;});
    const steps=root.querySelector('[data-hf-steps]');
    steps.innerHTML=stories[device].map((s,i)=>btn(`<span>0${i+1}</span>${s.title}`,'stage',i,'',i===stage?'aria-current="step"':'')).join('');
    root.querySelector('[data-hf-demo]').dataset.device=device;
    root.querySelector('[data-hf-demo]').setAttribute('aria-labelledby',`hf-entry-${device}`);
    root.querySelector('[data-hf-story]').innerHTML=`<p class="hf-story-kicker">${device==='app'?'App experience':'Protein Station'} · 0${stage+1} / 0${stories[device].length}</p><h3>${story.heading}</h3><p class="hf-story-copy">${story.copy}</p><div class="hf-try"><small>Try the interaction</small><p>${story.hint}</p></div><div class="hf-story-controls">${btn('← Previous','stage',stage-1,'',stage===0?'disabled':'')}${btn(stage===stories[device].length-1?'Back to start ↺':'Next step →','stage',stage===stories[device].length-1?0:stage+1,'')}</div>`;
    const appScreens={home,discover,detail,builder,custom:customBuilder,checkout,history,pickup,collected:collectedScreen,scan:scanScreen,profile};
    const stationScreens={login,catalog,ai,'station-custom':stationCustom,checkout:stationCheckout,'station-done':stationDone};
    const view=device==='app'?phone((appScreens[screen]||home)()):(stationScreens[screen]||login)();
    root.querySelector('[data-hf-mount]').innerHTML=view;
    fitStation();
    root.querySelector('[data-hf-caption]').textContent=device==='app'?'App · Interactive High-Fidelity prototype':'Protein Station · Interactive High-Fidelity prototype';
  }
  root.addEventListener('input',event=>{if(event.target.matches('[data-hf-prompt]')) prompt=event.target.value;});
  root.addEventListener('click',event=>{
    const entry=event.target.closest('[data-hf-device]');
    if(entry){device=entry.dataset.hfDevice;stage=0;screen=device==='app'?'home':'login';if(device==='station') guest=true;notice='';render();root.querySelector(`[data-hf-device="${device}"]`).focus({preventScroll:true});return;}
    const button=event.target.closest('[data-hf-action]');
    if(!button||button.disabled) return;
    const action=button.dataset.hfAction;
    const value=button.dataset.value;
    const number=Number(value);
    const scroll=root.querySelector('.hf-scroll, .hf-kiosk-products');
    const scrollTop=scroll?.scrollTop||0;
    switch(action){
      case 'stage':goStage(number);return;
      case 'screen':setScreen(value);return;
      case 'detail':selected=number;custom=false;setScreen('detail');return;
      case 'quick-order':selected=number;custom=false;quantity=1;setScreen('checkout');return;
      case 'nearby':machine=number;selected=0;custom=false;quantity=1;setScreen('checkout');return;
      case 'build':layer=0;custom=true;setScreen('custom');return;
      case 'choose':recipe[layers[layer].key]=value;custom=true;render();break;
      case 'layer':layer=Math.max(0,Math.min(number,3));render();root.querySelector('[data-hf-action="choose"][aria-pressed="true"]')?.focus({preventScroll:true});return;
      case 'finish-build':custom=true;setScreen('builder');flash('Your bar is ready to order.');return;
      case 'load':recipe={...recipes[number]};custom=true;render();flash(`${recipe.name} loaded.`);break;
      case 'prompt':prompt=value;render();break;
      case 'generate':recipe={...recipes[prompt.toLowerCase().includes('low')?1:0]};custom=true;render();flash('Sample recipe generated. Try building it layer by layer.');break;
      case 'save':if(!recipes.some(r=>r.base===recipe.base&&r.protein===recipe.protein&&r.mix===recipe.mix&&r.coating===recipe.coating)){recipes.unshift({...recipe,name:`My ${recipe.base} Bar`});} render();flash('Recipe saved for this visit.');break;
      case 'recipe-order':custom=true;quantity=1;setScreen('checkout');return;
      case 'quantity':quantity=Math.max(1,Math.min(9,quantity+number));render();break;
      case 'method':method=value;render();break;
      case 'machine':machine=number;render();break;
      case 'place-app':order={...currentItem(),machine,method,quantity};collected=false;setScreen('history');flash('Prototype order confirmed.');return;
      case 'pickup':setScreen(collected?'collected':'pickup');return;
      case 'collect-app':collected=true;setScreen('collected');return;
      case 'rewards':flash('Gold Member · 2,340 points · 660 pts to Platinum.');return;
      case 'scan':setScreen('scan');return;
      case 'scan-login':device='station';guest=false;setScreen('ai');flash('Logged in as Sarah.');return;
      case 'login':guest=false;setScreen('ai');flash('Logged in as Sarah.');return;
      case 'guest':guest=true;setScreen('catalog');return;
      case 'category':category=value;render();return;
      case 'add':cart.set(number,Math.min(9,(cart.get(number)||0)+1));render();flash(`${products[number].name} added.`);break;
      case 'remove':cart.delete(number);render();return;
      case 'cart-quantity':{const [i,delta]=value.split(':').map(Number);cart.set(i,Math.max(1,Math.min(9,(cart.get(i)||1)+delta)));render();break;}
      case 'station-checkout':setScreen('checkout');return;
      case 'place-station':cart.clear();setScreen('station-done');return;
      case 'reset-station':guest=true;cart.clear();category='All Flavors';setScreen('login');return;
      case 'open-app':device='app';custom=true;setScreen('builder');return;
      default:return;
    }
    const nextScroll=root.querySelector('.hf-scroll, .hf-kiosk-products');
    if(nextScroll) nextScroll.scrollTop=scrollTop;
    const candidates=root.querySelectorAll(`[data-hf-action="${action}"]`);
    const same=[...candidates].find(b=>b.dataset.value===value);
    if(same) same.focus({preventScroll:true});
  });
  // Arrow keys switch entry tabs without trapping the rest of the page's keyboard focus.
  root.querySelector('[role="tablist"]').addEventListener('keydown',event=>{
    if(!['ArrowLeft','ArrowRight','Home','End'].includes(event.key)) return;
    event.preventDefault();
    const tabs=[...root.querySelectorAll('[data-hf-device]')];
    const index=event.key==='Home'?0:event.key==='End'?1:device==='app'?1:0;
    tabs[index].click();
  });
  render();
})();
