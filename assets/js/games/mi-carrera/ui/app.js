(function (root) {
  'use strict';

  var NS = (root.MiCarrera = root.MiCarrera || {});
  var UI = (NS.UI = NS.UI || {});

  var BASE_YEAR = 2026;
  var COUNTRY_PAGE_SIZE = 14;

  function emptyDraft(name) {
    return {
      name: name || '',
      countryId: null,
      continentId: '',
      countryQuery: '',
      position: null,
      archetypeId: null,
      createStep: 1,
      careerSeed: null,
      startOptions: null,
      previewRating: null,
      previewPotential: null
    };
  }

  function App() {
    this.root = null;
    this.engine = null;
    this.data = null;
    this.state = null;
    this.screen = 'loading';
    this.draft = emptyDraft();
    this.focusAge = null;
    this.selectedOfferId = null;
    this._lastSeason = null;
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
    if (typeof document !== 'undefined' && document.body) {
      document.body.classList.add('mc-immersive');
      document.body.setAttribute('data-mc-screen', name);
    }
    var stage = this.root.querySelector('.mc-scene');
    if (stage) {
      stage.classList.remove('is-enter');
      // force reflow for enter animation
      void stage.offsetWidth;
      stage.classList.add('is-enter');
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
    var country =
      this.engine && active.player
        ? this.engine.world.countriesById[active.player.countryId]
        : null;
    var lastMoment =
      active.moments && active.moments.length ? active.moments[active.moments.length - 1] : null;
    var lastTitle =
      active.titles && active.titles.length ? active.titles[active.titles.length - 1] : null;
    var formInfo =
      NS.Rules && NS.Rules.formStatus ? NS.Rules.formStatus(active.form) : { label: '', emoji: '' };
    return {
      playerName: active.player.name,
      age: active.age,
      rating: active.rating,
      position: active.player.position,
      clubName: club ? club.shortName || club.name : 'Club',
      clubId: active.clubId,
      country: country,
      seasonIndex: active.seasonIndex,
      form: active.form,
      formLabel: formInfo.label,
      formEmoji: formInfo.emoji,
      lastHighlight: lastMoment
        ? lastMoment.label
        : lastTitle
          ? lastTitle.shortName || lastTitle.name
          : null
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
    if (!this.draft.createStep) this.draft.createStep = 1;
    if (!this.draft.name) {
      this.draft.name = localStorage.getItem('playerName') || '';
    }
    this.setRootScreen('create', UI.screens.create({ draft: this.draft, data: this.data }), {
      state: 'active'
    });
    if (this.draft.createStep === 2) this.refreshCountryList();
    if (this.draft.createStep === 1) {
      var input = document.getElementById('mc-player-name');
      if (input) input.focus();
    }
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
    var priority = [
      'country_ar',
      'country_br',
      'country_es',
      'country_mx',
      'country_us',
      'country_eng',
      'country_fr',
      'country_de',
      'country_it',
      'country_pt',
      'country_uy',
      'country_co'
    ];
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

  App.prototype.validateCreateStep = function () {
    var step = this.draft.createStep || 1;
    var errId = null;
    var msg = '';
    if (step === 1) {
      var name = String(this.draft.name || '').trim();
      if (name.length < 2) {
        errId = 'mc-name-error';
        msg = 'Ingresá un nombre (mínimo 2 caracteres).';
      }
    } else if (step === 2) {
      if (!this.draft.countryId) {
        errId = 'mc-country-error';
        msg = 'Elegí un país.';
      }
    } else if (step === 3) {
      if (!this.draft.position) {
        errId = 'mc-position-error';
        msg = 'Elegí una posición.';
      }
    } else if (step === 4) {
      if (!this.draft.archetypeId) {
        errId = 'mc-archetype-error';
        msg = 'Elegí un arquetipo.';
      }
    }
    ['mc-name-error', 'mc-country-error', 'mc-position-error', 'mc-archetype-error'].forEach(function (id) {
      var el = document.getElementById(id);
      if (el) {
        el.hidden = true;
        el.textContent = '';
      }
    });
    if (errId) {
      var node = document.getElementById(errId);
      if (node) {
        node.hidden = false;
        node.textContent = msg;
      }
      return false;
    }
    return true;
  };

  App.prototype.createNext = function () {
    var nameInput = document.getElementById('mc-player-name');
    if (nameInput) this.draft.name = nameInput.value;
    if (!this.validateCreateStep()) return;
    if ((this.draft.createStep || 1) < 4) {
      this.draft.createStep = (this.draft.createStep || 1) + 1;
      this.showCreate();
    }
  };

  App.prototype.createPrev = function () {
    if ((this.draft.createStep || 1) > 1) {
      this.draft.createStep -= 1;
      this.showCreate();
    } else {
      this.showIntro();
    }
  };

  App.prototype.showDebut = function () {
    if (!this.state) return;
    this.setRootScreen(
      'debut',
      UI.screens.debut({
        state: this.state,
        engine: this.engine
      }),
      { state: 'debut' }
    );
    this.announce('Debut profesional');
  };

  App.prototype.showPresent = function () {
    this.setRootScreen('present', UI.screens.present({ state: this.state, engine: this.engine }), {
      state: 'success'
    });
    this.announce('Primer contrato');
  };

  App.prototype.showCareerHome = function () {
    if (this.focusAge == null && this.state) this.focusAge = this.state.age;
    if (!this.selectedOfferId && this.state.pendingOffers && this.state.pendingOffers.length) {
      this.selectedOfferId = this.state.pendingOffers[0].id;
    }
    this.setRootScreen(
      'career-home',
      UI.screens.careerHome({
        state: this.state,
        engine: this.engine,
        focusAge: this.focusAge,
        selectedOfferId: this.selectedOfferId
      }),
      { state: 'active' }
    );
    this.announce('Temporada ' + UI.format.seasonLabel(this.state.seasonIndex, BASE_YEAR));
  };

  App.prototype.showSeason = function () {
    this.showCareerHome();
  };

  App.prototype.showMarket = function (opts) {
    opts = opts || {};
    if (opts.resetIndex) this.marketOfferIndex = 0;
    if (this.marketOfferIndex == null) this.marketOfferIndex = 0;
    var offers = this.state.pendingOffers || [];
    if (offers.length && this.marketOfferIndex >= offers.length) {
      this.marketOfferIndex = 0;
    }
    if (!this.selectedOfferId && offers.length) {
      this.selectedOfferId = offers[Math.min(this.marketOfferIndex, offers.length - 1)].id;
    }
    this.setRootScreen(
      'market',
      UI.screens.market({
        state: this.state,
        engine: this.engine,
        selectedOfferId: this.selectedOfferId,
        offerIndex: this.marketOfferIndex || 0
      }),
      { state: 'active' }
    );
    this.announce('Mercado de fichajes');
  };

  App.prototype.showSeasonRecap = function (season) {
    this._lastSeason = season;
    this.setRootScreen(
      'recap',
      UI.screens.seasonRecap({
        season: season,
        state: this.state,
        engine: this.engine
      }),
      { state: 'active' }
    );
    this.announce('Resumen de temporada');
  };

  App.prototype.showTransferCinematic = function (club) {
    this.setRootScreen(
      'cinematic',
      UI.screens.transferCinematic({
        club: club,
        state: this.state,
        engine: this.engine
      }),
      { state: 'success' }
    );
    this.announce('Fichaje confirmado');
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
    UI.Share.shareCareer(vm)
      .then(function (result) {
        if (result.aborted) return;
        if (result.method === 'share') {
          self.showShareToast('¡Compartido!');
        } else {
          self.showShareToast('¡Copiado!');
        }
      })
      .catch(function () {
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
    this.draft = emptyDraft(
      (this.state && this.state.player && this.state.player.name) || localStorage.getItem('playerName') || ''
    );
    this.state = null;
    this._retireCard = null;
    this._retireReward = null;
    this._lastSeason = null;
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

  App.prototype.resolveDecisionOnly = function (optionId, offerId, then) {
    if (this.busy || !this.state || this.state.retired) return;
    if (this.state.phase !== 'decision') return;
    this.busy = true;
    var result;
    try {
      result = this.engine.resolveDecision(this.state, optionId, offerId || undefined);
    } catch (err) {
      this.busy = false;
      UI.components.openModal({
        title: 'No se pudo resolver',
        bodyHtml: '<p>' + UI.format.escapeHtml((err && err.message) || 'Error') + '</p>',
        actionsHtml:
          '<button type="button" class="ct-button ct-button--primary" data-mc-modal="close">Entendido</button>'
      });
      return;
    }
    this.busy = false;
    this.selectedOfferId = null;
    if (result.retired) {
      this.showRetireTransition();
      return;
    }
    if (typeof then === 'function') {
      then(result);
    } else {
      this.showCareerHome();
    }
  };

  App.prototype.runSeason = function () {
    if (this.busy || !this.state || this.state.retired) return;
    if (this.state.phase !== 'simulate') return;
    this.busy = true;
    var before = this.snapshotAttrs(this.state);
    var result;
    try {
      result = this.engine.simulateCurrentSeason(this.state);
    } catch (err) {
      this.busy = false;
      UI.components.openModal({
        title: 'No se pudo simular',
        bodyHtml: '<p>' + UI.format.escapeHtml((err && err.message) || 'Error') + '</p>',
        actionsHtml:
          '<button type="button" class="ct-button ct-button--primary" data-mc-modal="close">Entendido</button>'
      });
      return;
    }

    var self = this;
    this._pendingSeasonResult = result;
    var finish = function () {
      self.focusAge = self.state.age;
      self.busy = false;
      if (self.state.retired) {
        self.showRetireTransition();
        return;
      }
      // Recap first — celebrations + market come after Continuar
      self.showSeasonRecap(result.season);
    };
    finish();
    void before;
  };

  App.prototype.afterSeasonRecap = function () {
    var result = this._pendingSeasonResult;
    var self = this;
    if (!result || !result.season) {
      this.showMarket({ resetIndex: true });
      return;
    }
    this._beatQueue = [];
    var seasonEvents =
      result.events && result.events.length
        ? result.events
        : result.event
          ? [result.event]
          : [];
    seasonEvents.slice(0, 2).forEach(function (ev) {
      if (ev) self._beatQueue.push({ type: 'event', event: ev });
    });
    this._beatQueue = this._beatQueue.concat(this.buildCelebrationQueue(result.season));
    this._onBeatsDone = function () {
      self._pendingSeasonResult = null;
      if (self.state && self.state.retired) {
        self.showRetireTransition();
        return;
      }
      self.showMarket({ resetIndex: true });
    };
    this.playNextBeat();
  };

  App.prototype.playNextBeat = function () {
    var queue = this._beatQueue || [];
    if (!queue.length) {
      var done = this._onBeatsDone;
      this._onBeatsDone = null;
      if (typeof done === 'function') done();
      return;
    }
    var next = queue.shift();
    this._beatQueue = queue;
    if (next.type === 'event') {
      this.setRootScreen('event', UI.screens.eventScene(next.event), { state: 'beat' });
      return;
    }
    if (next.type === 'title') {
      this.setRootScreen(
        'title',
        UI.screens.titleScene(next.titleObj, next.club, next.nt),
        { state: 'beat' }
      );
      return;
    }
    if (next.type === 'ballon-tease') {
      this.setRootScreen(
        'ballon-tease',
        UI.screens.ballonTease(next.award, next.playerName),
        { state: 'beat' }
      );
      return;
    }
    if (next.type === 'award') {
      this.setRootScreen('award', UI.screens.awardScene(next.award, next.playerName), {
        state: 'beat'
      });
      return;
    }
    if (next.type === 'moment') {
      this.setRootScreen('moment', UI.screens.momentScene(next.moment), { state: 'beat' });
      return;
    }
    this.playNextBeat();
  };

  /** @deprecated kept for smoke/compat — prefer resolveDecisionOnly + runSeason */
  App.prototype.chooseOption = function (optionId, offerId) {
    if (this.busy || !this.state || this.state.retired) return;
    if (this.focusAge != null && this.focusAge !== this.state.age) {
      this.focusAge = this.state.age;
    }
    if (this.state.phase === 'decision') {
      this.resolveDecisionOnly(optionId, offerId, function () {
        /* stay on home; user plays season next */
      });
      this.showCareerHome();
      return;
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
        actionsHtml:
          '<button type="button" class="ct-button ct-button--primary" data-mc-modal="close">Entendido</button>'
      });
      return;
    }

    var self = this;
    this.selectedOfferId = null;
    this.focusAge = this.state.age;
    this.busy = false;
    if (result.retired && !result.season) {
      this.showRetireTransition();
      return;
    }
    this._pendingSeasonResult = result;
    if (result.season) {
      this.showSeasonRecap(result.season);
    } else {
      this.showCareerHome();
    }
    void before;
  };

  App.prototype.buildCelebrationQueue = function (season) {
    var queue = [];
    if (!season || !this.state) return queue;
    var self = this;
    var playerName = this.state.player && this.state.player.name;

    var titles = (season.titles || []).slice().sort(function (a, b) {
      return (b.importance || 0) - (a.importance || 0);
    });
    titles.forEach(function (title) {
      var club = title.clubId ? self.engine.getClub(title.clubId) : null;
      var nt = title.nationalTeamId
        ? self.engine.world.nationalTeamsById[title.nationalTeamId]
        : null;
      queue.push({ type: 'title', titleObj: title, club: club, nt: nt });
    });

    (season.awards || []).forEach(function (award) {
      var tier =
        UI.Narrative && UI.Narrative.awardTier
          ? UI.Narrative.awardTier(award)
          : award.awardId === 'award_ballon_dor'
            ? 'ballon'
            : 'major';
      if (tier === 'minor') return;
      if (tier === 'ballon') {
        queue.push({ type: 'ballon-tease', award: award, playerName: playerName });
        queue.push({ type: 'award', award: award, playerName: playerName });
        return;
      }
      queue.push({ type: 'award', award: award, playerName: playerName });
    });

    var seasonIdx = season.seasonIndex;
    var momentPriority = {
      moment_ballon: 100,
      moment_world_cup: 95,
      moment_first_ucl: 90,
      moment_first_libertadores: 88,
      moment_first_league: 70,
      moment_first_callup: 60,
      moment_return_home: 55,
      moment_100_goals: 50,
      moment_500_apps: 45
    };
    var moments = [];
    (this.state.moments || []).forEach(function (moment) {
      if (moment.seasonIndex !== seasonIdx) return;
      if (moment.id === 'moment_retire' || moment.id === 'moment_intl_debut') return;
      var id = String(moment.id);
      var big =
        momentPriority[id] != null ||
        id.indexOf('moment_breakout_') === 0 ||
        id.indexOf('moment_comeback_') === 0 ||
        id.indexOf('moment_crisis_') === 0;
      if (!big) return;
      var score = momentPriority[id] || 40;
      if (id.indexOf('moment_breakout_') === 0) score = 75;
      if (id.indexOf('moment_comeback_') === 0) score = 72;
      if (id.indexOf('moment_crisis_') === 0) score = 65;
      moments.push({ moment: moment, score: score });
    });
    moments.sort(function (a, b) {
      return b.score - a.score;
    });
    moments.slice(0, 4).forEach(function (m) {
      queue.push({ type: 'moment', moment: m.moment });
    });

    return queue;
  };

  App.prototype.showRetireTransition = function () {
    this.showRetire();
  };

  App.prototype.openCompareModal = function (offerId) {
    var offer =
      (this.state.pendingOffers || []).filter(function (o) {
        return o.id === offerId;
      })[0] || null;
    if (!offer) return;
    this.selectedOfferId = offerId;
    this._compareOfferId = offerId;
    this.setRootScreen(
      'compare',
      UI.screens.compareScene({
        state: this.state,
        engine: this.engine,
        offer: offer
      }),
      { state: 'decision' }
    );
  };

  App.prototype.handleMarketStay = function () {
    UI.components.closeModal();
    var decision = this.state && this.state.currentDecision;
    if (this.state && this.state.phase === 'decision' && decision && decision.type === 'transferencia') {
      this.resolveDecisionOnly('stay_loyal', null, function () {});
      this.showCareerHome();
      return;
    }
    if (this.state && this.state.phase === 'decision') {
      this.state.clubRelation = Math.min(100, (this.state.clubRelation || 50) + 4);
      this.state.seasonModifiers = this.state.seasonModifiers || {};
      this.state.seasonModifiers.minutesBias =
        (this.state.seasonModifiers.minutesBias || 0) + 0.05;
      this.state.confidence = Math.min(100, (this.state.confidence || 55) + 2);
      this.state.currentDecision = null;
      this.state.phase = 'simulate';
      this.state.pendingOffers = [];
      if (NS.Storage && NS.Storage.saveActive) NS.Storage.saveActive(this.state);
    }
    this.showCareerHome();
  };

  App.prototype.handleMarketSign = function (offerId) {
    UI.components.closeModal();
    var oid = offerId || this._compareOfferId || this.selectedOfferId;
    var self = this;
    if (!this.state) return;
    var offer =
      (this.state.pendingOffers || []).filter(function (o) {
        return o.id === oid;
      })[0] || null;
    if (!offer) {
      this.showCareerHome();
      return;
    }
    if (!this.state.currentDecision || this.state.currentDecision.type !== 'transferencia') {
      var transfer = null;
      if (this.engine.world.decisionsById) {
        transfer = this.engine.world.decisions.filter(function (d) {
          return d.type === 'transferencia';
        })[0];
      }
      this.state.currentDecision = transfer
        ? JSON.parse(JSON.stringify(transfer))
        : {
            id: 'dec_transfer',
            type: 'transferencia',
            options: [
              { id: 'accept_best_prestige', effects: { transferPreference: 'prestige' } },
              { id: 'stay_loyal', effects: { transferPreference: 'stay' } }
            ]
          };
      this.state.phase = 'decision';
    }
    this.resolveDecisionOnly('accept_best_prestige', oid, function (result) {
      if (result.transferOffer) {
        var club = self.engine.getClub(result.transferOffer.clubId);
        self.showTransferCinematic(club);
      } else {
        self.showCareerHome();
      }
    });
  };

  App.prototype.seekLoanOffers = function () {
    if (!this.state || !this.engine) return;
    if (!NS.Rules.loanEligible || !NS.Rules.loanEligible(this.state, this.engine.world)) {
      this.announce('Ahora no hay una cesión coherente');
      return;
    }
    var rng = this.engine.getRng(this.state, 'seekLoan');
    var loans = NS.Rules.generateLoanOffers(this.state, this.engine.world, rng, 2);
    if (!loans.length) {
      this.announce('Ningún club ofrece cesión ahora');
      return;
    }
    var transfers = (this.state.pendingOffers || []).filter(function (o) {
      return o.kind !== 'loan';
    });
    this.state.pendingOffers = transfers.concat(loans);
    this.state.canLoan = true;
    this.state.phase = 'decision';
    this.state.currentDecision = NS.Decisions.pickDecision(
      this.state,
      this.engine.world,
      this.engine.getRng(this.state, 'loanDec')
    );
    if (NS.Storage && NS.Storage.saveActive) NS.Storage.saveActive(this.state);
    this.selectedOfferId = loans[0].id;
    this.marketOfferIndex = transfers.length;
    this.showMarket();
  };

  App.prototype.continueCareer = function () {
    var active = NS.Storage.loadActive();
    if (!active || active.retired) {
      this.showIntro();
      return;
    }
    this.state = active;
    this.focusAge = active.age;
    this.selectedOfferId =
      (active.pendingOffers && active.pendingOffers[0] && active.pendingOffers[0].id) || null;
    if (!this.state.currentDecision && this.state.phase === 'decision' && !this.state.retired) {
      var rng = this.engine.getRng(this.state, 'resumeDec');
      this.state.currentDecision = NS.Decisions.pickDecision(this.state, this.engine.world, rng);
      NS.Storage.saveActive(this.state);
    }
    var hasOffers = this.state.pendingOffers && this.state.pendingOffers.length;
    var isTransfer =
      this.state.currentDecision && this.state.currentDecision.type === 'transferencia';
    if (hasOffers || isTransfer) {
      this.showMarket();
    } else {
      this.showCareerHome();
    }
  };

  App.prototype.createFromDraft = function () {
    if (!this.validateCreateStep()) return;
    var name = String(this.draft.name || '').trim();
    try {
      var preview = this.engine.previewStartingClubs({
        name: name,
        countryId: this.draft.countryId,
        position: this.draft.position,
        archetypeId: this.draft.archetypeId,
        seed: this.draft.careerSeed || undefined
      });
      this.draft.careerSeed = preview.seed;
      this.draft.startOptions = preview.options;
      this.draft.previewRating = preview.rating;
      this.draft.previewPotential = preview.potential;
      localStorage.setItem('playerName', name);
      this.showStartClub();
    } catch (err) {
      UI.components.openModal({
        title: 'No se pudo crear',
        bodyHtml: '<p>' + UI.format.escapeHtml((err && err.message) || 'Error') + '</p>',
        actionsHtml:
          '<button type="button" class="ct-button ct-button--primary" data-mc-modal="close">Cerrar</button>'
      });
    }
  };

  App.prototype.showStartClub = function () {
    this.setRootScreen(
      'start-club',
      UI.screens.startClub({
        options: this.draft.startOptions || [],
        engine: this.engine,
        draft: this.draft
      }),
      { state: 'start-club' }
    );
    this.announce('Elegí tu primer club');
  };

  App.prototype.pickStartingClub = function (clubId) {
    var name = String(this.draft.name || '').trim();
    try {
      this.state = this.engine.createCareer({
        name: name,
        countryId: this.draft.countryId,
        position: this.draft.position,
        archetypeId: this.draft.archetypeId,
        seed: this.draft.careerSeed,
        clubId: clubId
      });
      this.showPresent();
    } catch (err) {
      UI.components.openModal({
        title: 'No se pudo firmar',
        bodyHtml: '<p>' + UI.format.escapeHtml((err && err.message) || 'Error') + '</p>',
        actionsHtml:
          '<button type="button" class="ct-button ct-button--primary" data-mc-modal="close">Cerrar</button>'
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
      self.draft = emptyDraft(localStorage.getItem('playerName') || '');
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
      this.draft = emptyDraft(localStorage.getItem('playerName') || '');
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
    if (action === 'new-career' || action === 'play-again') {
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
    if (action === 'create-next') {
      this.createNext();
      return;
    }
    if (action === 'create-prev') {
      this.createPrev();
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
      this.showDebut();
      return;
    }
    if (action === 'after-debut') {
      this.showCareerHome();
      return;
    }
    if (action === 'focus-age') {
      this.focusAge = Number(target.getAttribute('data-age'));
      this.showCareerHome();
      return;
    }
    if (action === 'after-recap') {
      this.afterSeasonRecap();
      return;
    }
    if (action === 'open-market') {
      this.showMarket();
      return;
    }
    if (action === 'market-next-offer') {
      var offerList = (this.state && this.state.pendingOffers) || [];
      this.marketOfferIndex = Math.min(
        (this.marketOfferIndex || 0) + 1,
        Math.max(0, offerList.length - 1)
      );
      if (offerList[this.marketOfferIndex]) {
        this.selectedOfferId = offerList[this.marketOfferIndex].id;
      }
      this.showMarket();
      return;
    }
    if (action === 'play-season') {
      this.runSeason();
      return;
    }
    if (action === 'select-offer') {
      this.selectedOfferId = target.getAttribute('data-offer');
      this.showMarket();
      return;
    }
    if (action === 'market-compare') {
      this.openCompareModal(target.getAttribute('data-offer') || this.selectedOfferId);
      return;
    }
    if (action === 'market-stay') {
      this.handleMarketStay();
      return;
    }
    if (action === 'seek-loan') {
      this.seekLoanOffers();
      return;
    }
    if (action === 'pick-start-club') {
      this.pickStartingClub(target.getAttribute('data-club'));
      return;
    }
    if (action === 'market-sign') {
      this.handleMarketSign(target.getAttribute('data-offer'));
      return;
    }
    if (action === 'after-transfer') {
      this.showCareerHome();
      return;
    }
    if (action === 'beat-continue') {
      this.playNextBeat();
      return;
    }
    if (action === 'choose-option') {
      var optionId = target.getAttribute('data-option');
      var offerId = null;
      if (optionId !== 'stay_loyal') {
        offerId = target.getAttribute('data-offer') || this.selectedOfferId;
      }
      var self = this;
      this.resolveDecisionOnly(optionId, offerId, function () {
        self.showCareerHome();
      });
      return;
    }
  };

  App.prototype.onSubmit = function (ev) {
    if (ev.target && ev.target.id === 'mc-create-form') {
      ev.preventDefault();
      var nameInput = document.getElementById('mc-player-name');
      if (nameInput) this.draft.name = nameInput.value;
      if ((this.draft.createStep || 1) < 4) {
        this.createNext();
        return;
      }
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
    if (action === 'market-sign') {
      this.handleMarketSign(btn.getAttribute('data-offer'));
      return;
    }
    if (action === 'market-stay') {
      this.handleMarketStay();
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
