(function (root) {
  'use strict';

  var NS = (root.MiCarrera = root.MiCarrera || {});
  var UI = (NS.UI = NS.UI || {});

  var BASE_YEAR = 2026;
  var COUNTRY_PAGE_SIZE = 14;

  function App() {
    this.root = null;
    this.engine = null;
    this.data = null;
    this.state = null;
    this.screen = 'loading';
    this.draft = {
      name: '',
      countryId: null,
      continentId: '',
      countryQuery: '',
      position: null,
      archetypeId: null
    };
    this.focusAge = null;
    this.selectedOfferId = null;
    this.busy = false;
    this._onClick = this.onClick.bind(this);
    this._onSubmit = this.onSubmit.bind(this);
    this._onInput = this.onInput.bind(this);
    this._onKeydown = this.onKeydown.bind(this);
  }

  App.prototype.mount = function (selector) {
    this.root = typeof selector === 'string' ? document.querySelector(selector) : selector;
    if (!this.root) throw new Error('No se encontró el contenedor de Mi Carrera');
    this.root.addEventListener('click', this._onClick);
    this.root.addEventListener('submit', this._onSubmit);
    this.root.addEventListener('input', this._onInput);
    document.addEventListener('keydown', this._onKeydown);
    var modal = document.getElementById('mc-modal-root');
    if (modal) modal.addEventListener('click', this.onModalClick.bind(this));
    this.renderLoading();
    this.boot();
  };

  App.prototype.boot = function () {
    var self = this;
    NS.boot()
      .then(function (bundle) {
        self.engine = bundle.engine;
        self.data = bundle.data;
        self.showIntro();
      })
      .catch(function (err) {
        self.renderError((err && err.message) || 'Error cargando datos');
      });
  };

  App.prototype.setRootScreen = function (name, html, opts) {
    opts = opts || {};
    this.screen = name;
    this.root.innerHTML = html;
    this.root.setAttribute('data-screen', name);
    this.root.setAttribute('data-state', opts.state || name);
    if (opts.busy) {
      this.root.setAttribute('aria-busy', 'true');
    } else {
      this.root.setAttribute('aria-busy', 'false');
    }
  };

  App.prototype.renderLoading = function () {
    this.setRootScreen('loading', UI.components.loadingSkeleton(), { busy: true, state: 'loading' });
  };

  App.prototype.renderError = function (message) {
    this.setRootScreen('error', UI.components.errorBlock(message), { state: 'error' });
  };

  App.prototype.getActiveSummary = function () {
    var active = NS.Storage.loadActive();
    if (!active || active.retired) return null;
    var club = this.engine ? this.engine.getClub(active.clubId) : null;
    return {
      playerName: active.player.name,
      age: active.age,
      rating: active.rating,
      clubName: club ? club.shortName || club.name : 'Club',
      seasonIndex: active.seasonIndex
    };
  };

  App.prototype.showIntro = function () {
    this.state = null;
    this.focusAge = null;
    this.setRootScreen(
      'intro',
      UI.screens.intro({
        activeSummary: this.getActiveSummary()
      }),
      { state: this.getActiveSummary() ? 'resume' : 'empty' }
    );
    this.announce('Mi Carrera');
    var hash = (typeof location !== 'undefined' && location.hash) || '';
    if (hash === '#como-funciona') {
      setTimeout(function () {
        var el = document.getElementById('como-funciona');
        if (el && typeof el.scrollIntoView === 'function') {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 40);
    }
  };

  App.prototype.showCreate = function () {
    if (!this.draft.name) {
      this.draft.name = localStorage.getItem('playerName') || '';
    }
    this.setRootScreen('create', UI.screens.create({ draft: this.draft, data: this.data }), {
      state: 'active'
    });
    this.refreshCountryList();
    var input = document.getElementById('mc-player-name');
    if (input) input.focus();
  };

  App.prototype.filteredCountries = function () {
    var q = String(this.draft.countryQuery || '')
      .trim()
      .toLowerCase();
    var continentId = this.draft.continentId;
    var list = (this.data.countries || []).filter(function (c) {
      if (continentId && c.continentId !== continentId) return false;
      if (!q) return true;
      return (
        c.name.toLowerCase().indexOf(q) !== -1 ||
        (c.nationality && c.nationality.toLowerCase().indexOf(q) !== -1) ||
        (c.iso2 && c.iso2.toLowerCase().indexOf(q) !== -1)
      );
    });
    var priority = ['country_ar', 'country_br', 'country_es', 'country_mx', 'country_us', 'country_eng', 'country_fr', 'country_de', 'country_it', 'country_pt', 'country_uy', 'country_co'];
    if (!q && !continentId) {
      list.sort(function (a, b) {
        var ia = priority.indexOf(a.id);
        var ib = priority.indexOf(b.id);
        if (ia === -1 && ib === -1) return a.name.localeCompare(b.name, 'es');
        if (ia === -1) return 1;
        if (ib === -1) return -1;
        return ia - ib;
      });
    } else {
      list.sort(function (a, b) {
        return a.name.localeCompare(b.name, 'es');
      });
    }
    return list.slice(0, COUNTRY_PAGE_SIZE);
  };

  App.prototype.refreshCountryList = function () {
    var node = document.getElementById('mc-country-list');
    if (!node) return;
    node.innerHTML = UI.screens.countryResultsHtml(this.filteredCountries(), this.draft.countryId);
  };

  App.prototype.showPresent = function () {
    this.setRootScreen('present', UI.screens.present({ state: this.state, engine: this.engine }), {
      state: 'success'
    });
  };

  App.prototype.showSeason = function () {
    if (this.focusAge == null) this.focusAge = this.state.age;
    if (!this.selectedOfferId && this.state.pendingOffers && this.state.pendingOffers.length) {
      this.selectedOfferId = this.state.pendingOffers[0].id;
    }
    this.setRootScreen(
      'season',
      UI.screens.season({
        state: this.state,
        engine: this.engine,
        focusAge: this.focusAge,
        selectedOfferId: this.selectedOfferId
      }),
      { state: 'active' }
    );
    this.announce('Temporada ' + UI.format.seasonLabel(this.state.seasonIndex, BASE_YEAR));
  };

  App.prototype.showRetire = function () {
    if (this.state && this.state.retired) {
      NS.Storage.ensureHistoryEntry(this.state);
    }
    var achievements = UI.Legacy.detectAchievements(this.state, this.engine.world);
    this._retireReward = UI.Rewards.grantCareerRewards(this.state, {
      achievements: achievements
    });
    this._retireCard = UI.CareerCardRenderer.render(this.state, this.engine);
    this.setRootScreen(
      'retire',
      UI.screens.retire({
        state: this.state,
        engine: this.engine,
        reward: this._retireReward
      }),
      { state: 'success' }
    );
    this.announce('Tu carrera terminó');
  };

  App.prototype.showShareToast = function (message) {
    var toast = document.getElementById('mc-share-toast');
    if (!toast) return;
    toast.hidden = false;
    toast.textContent = message;
    clearTimeout(this._toastTimer);
    this._toastTimer = setTimeout(function () {
      toast.hidden = true;
      toast.textContent = '';
    }, 2200);
  };

  App.prototype.handleShare = function () {
    var self = this;
    var vm = this._retireCard && this._retireCard.viewModel;
    if (!vm) return;
    UI.Share.shareCareer(vm).then(function (result) {
      if (result.aborted) return;
      if (result.method === 'share') {
        self.showShareToast('¡Compartido!');
      } else {
        self.showShareToast('¡Copiado!');
      }
    }).catch(function () {
      self.showShareToast('No se pudo compartir');
    });
  };

  App.prototype.handleCopy = function () {
    var self = this;
    var vm = this._retireCard && this._retireCard.viewModel;
    if (!vm) return;
    var text = UI.Share.buildShareText(vm);
    UI.Share.copyText(text)
      .then(function () {
        self.showShareToast('¡Copiado!');
      })
      .catch(function () {
        self.showShareToast('No se pudo copiar');
      });
  };

  App.prototype.playAgain = function () {
    if (this.state && this.state.retired) {
      NS.Storage.ensureHistoryEntry(this.state);
    }
    NS.Storage.clearActive();
    this.draft = {
      name: (this.state && this.state.player && this.state.player.name) || localStorage.getItem('playerName') || '',
      countryId: null,
      continentId: '',
      countryQuery: '',
      position: null,
      archetypeId: null
    };
    this.state = null;
    this._retireCard = null;
    this._retireReward = null;
    this.showCreate();
  };

  App.prototype.announce = function (text) {
    var live = document.getElementById('mc-live');
    if (live) live.textContent = text;
  };

  App.prototype.snapshotAttrs = function (state) {
    return {
      rating: state.rating,
      marketValue: state.marketValue,
      prestige: state.prestige,
      popularity: state.popularity,
      form: state.form,
      money: state.money,
      clubId: state.clubId
    };
  };

  App.prototype.chooseOption = function (optionId, offerId) {
    if (this.busy || !this.state || this.state.retired) return;
    if (this.focusAge != null && this.focusAge !== this.state.age) {
      this.focusAge = this.state.age;
    }
    this.busy = true;
    var before = this.snapshotAttrs(this.state);
    var result;
    try {
      result = this.engine.playSeason(this.state, optionId, offerId || undefined);
    } catch (err) {
      this.busy = false;
      UI.components.openModal({
        title: 'No se pudo resolver',
        bodyHtml: '<p>' + UI.format.escapeHtml((err && err.message) || 'Error') + '</p>',
        actionsHtml: '<button type="button" class="ct-button ct-button--primary" data-mc-modal="close">Entendido</button>'
      });
      return;
    }

    var self = this;
    var afterFlow = function () {
      self.selectedOfferId = null;
      self.focusAge = self.state.age;
      self.busy = false;
      if (self.state.retired) {
        self.showRetireTransition();
        return;
      }
      self.showSeason();
    };

    var showFeedback = function () {
      if (!result.season) {
        afterFlow();
        return;
      }
      var deltas = {
        rating: (result.season.ratingAfter != null ? result.season.ratingAfter : self.state.rating) - before.rating,
        marketValue: self.state.marketValue - before.marketValue,
        prestige: self.state.prestige - before.prestige
      };
      UI.components.openModal({
        title: 'Cierre de temporada',
        size: 'lg',
        bodyHtml: UI.screens.seasonFeedbackBody({ season: result.season, deltas: deltas }),
        actionsHtml:
          '<button type="button" class="ct-button ct-button--primary" data-mc-modal="continue-season">Continuar</button>'
      });
      self._pendingAfterModal = afterFlow;
    };

    var celebrateQueue = self.buildCelebrationQueue(result.season);
    var runCelebrations = function () {
      if (!celebrateQueue.length) {
        showFeedback();
        return;
      }
      var next = celebrateQueue.shift();
      UI.components.openModal({
        title: next.title,
        size: 'lg',
        bodyHtml: next.bodyHtml,
        actionsHtml:
          '<button type="button" class="ct-button ct-button--primary" data-mc-modal="after-event">Continuar</button>'
      });
      self._pendingAfterModal = runCelebrations;
    };

    if (result.event) {
      UI.components.openModal({
        title: result.event.title || 'Evento',
        size: 'lg',
        bodyHtml: UI.screens.eventModalBody(result.event),
        actionsHtml: '<button type="button" class="ct-button ct-button--primary" data-mc-modal="after-event">Continuar</button>'
      });
      this._pendingAfterModal = runCelebrations;
    } else if (result.retired && !result.season) {
      this.busy = false;
      this.showRetireTransition();
    } else {
      runCelebrations();
    }
  };

  App.prototype.buildCelebrationQueue = function (season) {
    var queue = [];
    if (!season || !this.state) return queue;
    var self = this;
    var playerName = this.state.player && this.state.player.name;

    (season.titles || []).forEach(function (title) {
      var club = title.clubId ? self.engine.getClub(title.clubId) : null;
      var nt = title.nationalTeamId
        ? self.engine.world.nationalTeamsById[title.nationalTeamId]
        : null;
      queue.push({
        title: 'Campeón',
        bodyHtml: UI.screens.titleCelebrationBody(title, club, nt)
      });
    });

    (season.awards || []).forEach(function (award) {
      queue.push({
        title: award.name || 'Premio',
        bodyHtml: UI.screens.awardCelebrationBody(award, playerName)
      });
    });

    var seasonIdx = season.seasonIndex;
    (this.state.moments || []).forEach(function (moment) {
      if (moment.seasonIndex !== seasonIdx) return;
      if (
        moment.id === 'moment_retire' ||
        moment.id === 'moment_first_callup' ||
        moment.id === 'moment_intl_debut'
      ) {
        // call-up is nice but keep queue short; still show big moments
        if (moment.id === 'moment_intl_debut') return;
      }
      var big =
        moment.id === 'moment_first_league' ||
        moment.id === 'moment_first_ucl' ||
        moment.id === 'moment_first_libertadores' ||
        moment.id === 'moment_world_cup' ||
        moment.id === 'moment_ballon' ||
        moment.id === 'moment_100_goals' ||
        moment.id === 'moment_500_apps' ||
        moment.id === 'moment_return_home';
      if (!big) return;
      queue.push({
        title: 'Entrá en la historia',
        bodyHtml: UI.screens.momentCelebrationBody(moment)
      });
    });

    return queue;
  };

  App.prototype.showRetireTransition = function () {
    var self = this;
    UI.components.openModal({
      title: 'Tu carrera terminó',
      bodyHtml: '<p>El ciclo se cierra. Prepará el resumen final.</p>',
      actionsHtml: '<button type="button" class="ct-button ct-button--primary" data-mc-modal="show-retire">Ver resumen</button>'
    });
    this._pendingAfterModal = function () {
      self.showRetire();
    };
  };

  App.prototype.continueCareer = function () {
    var active = NS.Storage.loadActive();
    if (!active || active.retired) {
      this.showIntro();
      return;
    }
    this.state = active;
    this.focusAge = active.age;
    this.selectedOfferId = (active.pendingOffers && active.pendingOffers[0] && active.pendingOffers[0].id) || null;
    if (this.state.phase === 'simulate' && !this.state.retired) {
      try {
        this.engine.simulateCurrentSeason(this.state);
      } catch (e) {
        /* keep state; user can still interact */
      }
    }
    if (!this.state.currentDecision && this.state.phase === 'decision' && !this.state.retired) {
      var rng = this.engine.getRng(this.state, 'resumeDec');
      this.state.currentDecision = NS.Decisions.pickDecision(this.state, this.engine.world, rng);
      NS.Storage.saveActive(this.state);
    }
    this.showSeason();
  };

  App.prototype.createFromDraft = function () {
    var errors = [];
    var name = String(this.draft.name || '').trim();
    if (name.length < 2) errors.push(['mc-name-error', 'Ingresá un nombre (mínimo 2 caracteres).']);
    if (!this.draft.countryId) errors.push(['mc-country-error', 'Elegí un país.']);
    if (!this.draft.position) errors.push(['mc-position-error', 'Elegí una posición.']);
    if (!this.draft.archetypeId) errors.push(['mc-archetype-error', 'Elegí un arquetipo.']);

    ['mc-name-error', 'mc-country-error', 'mc-position-error', 'mc-archetype-error'].forEach(function (id) {
      var el = document.getElementById(id);
      if (el) {
        el.hidden = true;
        el.textContent = '';
      }
    });
    if (errors.length) {
      errors.forEach(function (pair) {
        var el = document.getElementById(pair[0]);
        if (el) {
          el.hidden = false;
          el.textContent = pair[1];
        }
      });
      return;
    }

    try {
      this.state = this.engine.createCareer({
        name: name,
        countryId: this.draft.countryId,
        position: this.draft.position,
        archetypeId: this.draft.archetypeId
      });
      localStorage.setItem('playerName', name);
      this.showPresent();
    } catch (err) {
      UI.components.openModal({
        title: 'No se pudo crear',
        bodyHtml: '<p>' + UI.format.escapeHtml((err && err.message) || 'Error') + '</p>',
        actionsHtml: '<button type="button" class="ct-button ct-button--primary" data-mc-modal="close">Cerrar</button>'
      });
    }
  };

  App.prototype.confirmNewCareer = function () {
    var self = this;
    UI.components.openModal({
      title: '¿Nueva carrera?',
      bodyHtml:
        '<p>Hay una carrera activa. Si empezás otra, se reemplaza la partida en curso (el historial de carreras terminadas se conserva).</p>',
      actionsHtml:
        '<button type="button" class="ct-button ct-button--secondary" data-mc-modal="close">Cancelar</button>' +
        '<button type="button" class="ct-button ct-button--danger" data-mc-modal="confirm-new">Empezar nueva</button>'
    });
    this._pendingAfterModal = null;
    this._onConfirmNew = function () {
      NS.Storage.clearActive();
      self.draft = {
        name: localStorage.getItem('playerName') || '',
        countryId: null,
        continentId: '',
        countryQuery: '',
        position: null,
        archetypeId: null
      };
      self.showCreate();
    };
  };

  App.prototype.advanceModal = function () {
    var next = this._pendingAfterModal;
    this._pendingAfterModal = null;
    UI.components.closeModal();
    if (typeof next === 'function') next();
  };

  App.prototype.onClick = function (ev) {
    if (!ev.target || typeof ev.target.closest !== 'function') return;
    var target = ev.target.closest('[data-mc-action]');
    if (!target || !this.root.contains(target)) return;
    var action = target.getAttribute('data-mc-action');

    if (action === 'retry') {
      this.renderLoading();
      this.boot();
      return;
    }
    if (action === 'start-create') {
      this.showCreate();
      return;
    }
    if (action === 'go-intro') {
      this.showIntro();
      return;
    }
    if (action === 'continue-career') {
      this.continueCareer();
      return;
    }
    if (action === 'new-career-confirm') {
      this.confirmNewCareer();
      return;
    }
    if (action === 'new-career') {
      this.playAgain();
      return;
    }
    if (action === 'play-again') {
      this.playAgain();
      return;
    }
    if (action === 'share-career') {
      this.handleShare();
      return;
    }
    if (action === 'copy-career') {
      this.handleCopy();
      return;
    }
    if (action === 'filter-continent') {
      this.draft.continentId = target.getAttribute('data-id') || '';
      this.showCreate();
      return;
    }
    if (action === 'pick-country') {
      this.draft.countryId = target.getAttribute('data-id');
      this.showCreate();
      return;
    }
    if (action === 'pick-position') {
      this.draft.position = target.getAttribute('data-id');
      this.showCreate();
      return;
    }
    if (action === 'pick-archetype') {
      this.draft.archetypeId = target.getAttribute('data-id');
      this.showCreate();
      return;
    }
    if (action === 'begin-career') {
      this.focusAge = this.state.age;
      this.showSeason();
      return;
    }
    if (action === 'focus-age') {
      this.focusAge = Number(target.getAttribute('data-age'));
      this.showSeason();
      return;
    }
    if (action === 'select-offer') {
      this.selectedOfferId = target.getAttribute('data-offer');
      this.showSeason();
      return;
    }
    if (action === 'choose-option') {
      var optionId = target.getAttribute('data-option');
      var offerId = null;
      if (optionId !== 'stay_loyal') {
        offerId = target.getAttribute('data-offer') || this.selectedOfferId;
      }
      this.chooseOption(optionId, offerId);
    }
  };

  App.prototype.onSubmit = function (ev) {
    if (ev.target && ev.target.id === 'mc-create-form') {
      ev.preventDefault();
      var nameInput = document.getElementById('mc-player-name');
      if (nameInput) this.draft.name = nameInput.value;
      this.createFromDraft();
    }
  };

  App.prototype.onInput = function (ev) {
    if (ev.target && ev.target.id === 'mc-country-search') {
      this.draft.countryQuery = ev.target.value;
      this.refreshCountryList();
    }
    if (ev.target && ev.target.id === 'mc-player-name') {
      this.draft.name = ev.target.value;
      var nameEl = this.root && this.root.querySelector('.mc-player-card__name');
      if (nameEl) {
        var n = String(this.draft.name || '').trim();
        nameEl.textContent = n || 'Tu nombre';
      }
    }
  };

  App.prototype.onKeydown = function (ev) {
    if (ev.key === 'Escape') {
      var overlay = document.getElementById('mc-modal-root');
      if (overlay && overlay.classList.contains('is-open')) {
        if (this._pendingAfterModal) {
          ev.preventDefault();
          this.advanceModal();
          return;
        }
        UI.components.closeModal();
      }
    }
  };

  App.prototype.onModalClick = function (ev) {
    if (!ev.target || typeof ev.target.closest !== 'function') return;
    var btn = ev.target.closest('[data-mc-modal]');
    if (!btn) {
      return;
    }
    var action = btn.getAttribute('data-mc-modal');
    if (action === 'close') {
      UI.components.closeModal();
      return;
    }
    if (action === 'confirm-new') {
      UI.components.closeModal();
      if (this._onConfirmNew) this._onConfirmNew();
      return;
    }
    if (action === 'after-event' || action === 'continue-season' || action === 'show-retire') {
      this.advanceModal();
    }
  };

  UI.App = App;
  UI.start = function (selector) {
    if (NS._uiApp && NS._uiApp.root) {
      return NS._uiApp;
    }
    var app = new App();
    app.mount(selector || '#mc-app');
    NS._uiApp = app;
    return app;
  };
})(typeof globalThis !== 'undefined' ? globalThis : window);
