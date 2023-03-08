// ==UserScript==
// @name         IdleLoops Squirrel Predictor Makro
// @namespace    https://github.com/Tomnar9/
// @downloadURL  https://raw.githubusercontent.com/Tomnar9/IdleLoops-Predictor/master/idleloops-predictor.user.js
// @version      0.3.11
// @description  Predicts the amount of resources spent and gained by each action in the action list. Valid as of IdleLoops Reworked  v.0.2.7/Morana.
// @author       Koviko <koviko.net@gmail.com>, Tomnar <Tomnar#4672 on discord>
// @match        https://mopatissier.github.io/IdleLoopsReworked/
// @run-at       document-idle
// ==/UserScript==
window.eval(`
/** @namespace \`*/
const Koviko = {
  /**
   * IdleLoops view
   * @typedef {Object} Koviko~View
   * @prop {function} updateNextActions Method responsible for updating the view
   */

  /**
   * Represents an action in the action list
   * @typedef {Object} Koviko~ListedAction
   * @prop {string} name Name of the action
   * @prop {number} loops Number of loops to perform
   */

  /**
   * IdleLoops action
   * @typedef {Object} Koviko~Action
   * @prop {string} name Name of the action
   * @prop {number} expMult Experience multiplier (typically 1)
   * @prop {number} townNum The town to which the action belongs
   * @prop {string} varName The unique identifier used for variables in the \`towns\` array
   * @prop {number} [segments] Amount of segments per loop
   * @prop {number} [dungeonNum] The dungeon to which the action belongs
   * @prop {Object.<string, number>} stats Stats that affect and are affected by the action
   * @prop {Array.<string>} [loopStats] Stats used in the respective segment per loop
   * @prop {function} manaCost Mana cost to complete the action
   */

  /**
   * IdleLoops town, which includes total progression for all actions
   * @typedef {Object} Koviko~Town
   */

  /**
   * IdleLoops dungeon floor
   * @typedef {Object} Koviko~DungeonFloor
   * @prop {number} ssChance Chance to get a soulstone
   * @prop {number} completed Amount of times completed
   */

  /**
   * IdleLoops skill
   * @typedef {Object} Koviko~Skill
   * @prop {number} exp Experience
   */

  /**
   * Globals
   * @prop {Koviko~View} view IdleLoops view object
   * @prop {Object} actions IdleLoops actions object
   * @prop {Object} Action IdleLoops Action object
   * @prop {Array.<Koviko~ListedAction>} actions.next Action List
   * @prop {HTMLElement} nextActionsDiv Action list container
   * @prop {Array.<string>} statList Names of all stats
   * @prop {Object.<string, Koviko~Skill>} skills Skill objects
   * @prop {Array.<Koviko~Town>} towns Town objects
   * @prop {Array.<Array.<Koviko~DungeonFloor>>} dungeons Dungeon objects
   * @prop {function} fibonacci Calculates the value of the given index of the Fibonacci sequence
   * @prop {function} precision3 Rounds numbers to a precision of 3
   * @prop {function} translateClassNames Converts an action name to a {@link Koviko~Action} object
   * @prop {function} getLevelFromExp Converts an amount of stat experience into a level
   * @prop {function} getSkillLevelFromExp Converts an amount of skill experience into a level
   * @prop {function} getTotalBonusXP Determine the current amount of bonus XP from talents and soulstones
   */
  globals: {
    view: null,
    actions: null,
    Action: null,
    nextActionsDiv: null,
    statList: null,
    skills: null,
    towns: null,
    dungeons: null,
    fibonacci: null,
    precision3: null,
    translateClassNames: null,
    getLevelFromExp: null,
    getSkillLevelFromExp: null,
    getTotalBonusXP: null,
  },

  /** A prediction, capable of calculating and estimating ticks and rewards of an action. */
  Prediction: class {
    /**
     * Loop attributes for a prediction
     * @typedef {Object} Koviko.Prediction~Loop
     * @prop {function} cost Cost to complete a segment
     * @prop {function} tick Amount of progress completed in one tick
     * @prop {Object} effect Effects at the end of a loop or segment
     * @prop {function} [effect.segment] Effect at the end of a segment
     * @prop {function} [effect.loop] Effect at the end of a loop
     */

    /**
     * Parameters to be passed to the Prediction constructor
     * @typedef {Object} Koviko.Prediction~Parameters
     * @prop {Array.<string>} affected Affected resources
     * @prop {function} effect Method that will mutate resources
     * @prop {Koviko.Prediction~Loop} loop Loop attributes
     */

    /**
     * Create the prediction
     * @param {string} name Name of the action
     * @param {Koviko.Prediction~Parameters} params Parameter object
     */
    constructor(name, params) {
      /**
       * Name of the action
       * @member {string}
       */
      this.name = name;

      /**
       * Action being estimated
       * @member {Koviko~Action}
       */
      this.action = Koviko.globals.translateClassNames(name);

      /**
       * The pre-calculated amount of ticks needed for the action to complete.
       * @member {number}
       */
      this._ticks = 0;

      /**
       * Resources affected by the action
       * @member {Array.<string>}
       */
      this.affected = params.affected || [];

      /**
       * Effect of the action.
       * @member {function|null}
       */
      this.effect = params.effect || null;

      /**
       * Effect(s) and tick calculations of the action's loops
       * @member {Koviko.Prediction~Loop|null}
       */
      this.loop = params.loop || null;

      this.canStart = params.canStart || true;

      this.manaCost = params.manaCost || false;
    }

    /**
     * Calculate the number of ticks needed to complete the action.
     * @param {Koviko.Prediction~Action} a Action object
     * @param {Koviko.Predictor~Stats} s Accumulated stat experience
     * @memberof Koviko.Prediction
     */
    updateTicks(a, s, state, isSquirrel) {
      let baseMana=this.baseManaCost(a,state, isSquirrel);
      let cost = Koviko.globals.statList.reduce((cost, i) => cost + (i in a.stats && i in s ? a.stats[i] /  Math.sqrt(1 + Koviko.globals.getLevelFromExp(s[i]) / 100) : 0), 0);
      this._baseManaCost=baseMana;
      return (this._ticks = Math.ceil(baseMana * cost - .000001));
    }

    //returns the base mana cost of the action referenced, taking the context
    baseManaCost(a,state=false, isSquirrel=false) {
      if (this.manaCost) {
        if (state) {
          return this.manaCost(state.resources,state.skills, isSquirrel);
        } else {
          return this._baseManaCost;
        }
      } else {
        return a.manaCost(isSquirrel);
      }
    }

    /**
     * Get the pre-calculated amount of ticks needed for the action to complete.
     * @memberof Koviko.Prediction
     */
    ticks() {
      return this._ticks || 0;
    }

    /**
     * Add the experience gained in one tick to the accumulated stat experience.
     * @param {Koviko.Prediction~Action} a Action object
     * @param {Koviko.Predictor~Stats} s Accumulated stat experience
     * @memberof Koviko.Prediction
     */
    exp(a, s, t) {
      Koviko.globals.statList.forEach(i => {
        if (i in a.stats && i in s) {
          let expToAdd=a.stats[i] * a.expMult * (this._baseManaCost / this.ticks()) * this.getTotalBonusXP(i,t);
          s[i] += expToAdd;
          let talentGain = expToAdd*(getSkillBonus("Wunderkind") + getBuffLevel("Aspirant") * 0.01) / 100;
          t[i] += talentGain;
        }
      });
    }

    getTotalBonusXP(statName,t) {
      const soulstoneBonus = stats[statName].soulstone ? calcSoulstoneMult(stats[statName].soulstone) : 1;
      return soulstoneBonus * calcTalentMult(getLevelFromTalent(t[statName]));
    }

  },

  /** A collection of attributes and a comparison of those attributes from one snapshot to the next. */
  Snapshot: class {
    /**
     * Attributes to consider from one snapshot to the next.
     * @typedef {Object.<string, number>} Koviko.Snapshot~Attributes
     */

    /**
     * Comparison of current snapshot to last snapshot.
     * @typedef {Object} Koviko.Snapshot~Comparison
     * @prop {number} value New value after the snapshot is taken
     * @prop {number} delta Difference between new value and old value
     */

    /**
     * Create the snapshot handler.
     * @param {Koviko.Snapshot~Attributes} attributes Attributes and their values
     * @memberof Koviko.Snapshot
     */
    constructor(attributes) {
      /**
       * Valid attributes for a snapshot
       * @member {Object.<string, number>}
       */
      this.attributes = {};

      /**
       * Whether the attributes have been initialized
       * @member {boolean}
       */
      this._isInitialized = false;

      if (attributes) {
        this.init(attributes);
      }
    }

    /**
     * Initialize the attributes to consider in each snapshot.
     * @param {Koviko.Snapshot~Attributes} attributes Attributes and their values
     * @return {Object.<string, Koviko.Snapshot~Comparison>} Initial comparison values
     * @memberof Koviko.Snapshot
     */
    init(attributes) {
      for (let i in attributes) {
        this.attributes[i] = { value: attributes[i], delta: 0 };
      }

      this._isInitialized = true;

      return this.attributes;
    }

    /**
     * Take a snapshot of the attributes and compare them to the previous snapshot.
     * @param {Koviko.Snapshot~Attributes} attributes Attributes and their values
     * @return {Object.<string, Koviko.Snapshot~Comparison>} Comparison values from the last snapshot to the current one
     * @memberof Koviko.Snapshot
     */
    snap(attributes) {
      if (!this._isInitialized) {
        this.init(attributes);
      }

      for (let i in this.attributes) {
        this.attributes[i].delta = attributes[i] - (this.attributes[i].value || 0);
        this.attributes[i].value = attributes[i];
      }

      return this.attributes;
    }

    /**
     * Get the snapshot.
     * @return {Object.<string, Koviko.Snapshot~Comparison>} Comparison values from the last snapshot to the current one
     * @memberof Koviko.Snapshot
     */
    get() {
      return this.attributes;
    }
  },

  /** A cache so the predictor can skip expensivly calculating each action */

  Cache: class{
    constructor(){
      this.cache = [];
      this.index = 0;
    }
    next(key) {
      if(this.cache.length > (this.index + 1) && this.equals(this.cache[this.index + 1].key, key)){
        return structuredClone(this.cache[++this.index].data);
      } else{
        this.miss();
        return false;
      };
    }
    // Use current = true to invalidate the entry after reading it, current = false to invalidate the next entry
    miss(current = false) {
      this.cache = this.cache.slice(0, this.index + !current);
    }
    reset(data) {
      this.index = 0;
      if(!this.equals(data, this.cache[0]?.data)){
        this.cache = [{key: '', data: structuredClone(data)}]
        return false;
      }
      return true;
    }
    add(key, data) {
      this.cache.push({'key': key, 'data':structuredClone(data)})
    }
    // Why is this something i have to write
    equals(thing1, thing2) {
      return JSON.stringify(thing1) === JSON.stringify(thing2);
    }
  },

  /** A predictor which uses Predictions to calculate and estimate an entire action list. */
  Predictor: class {
    /**
     * Progression
     * @typedef {Object} Koviko.Predictor~Progression
     * @prop {number} completed The amount of total segments completed
     * @prop {number} progress The amount of progress in segments beyond that already represented in \`completed\`
     * @prop {number} total The amount of successful loops ever completed
     */

    /**
     * Accumulated stat experience
     * @typedef {Object.<string, number>} Koviko.Predictor~Stats
     */

    /**
     * Accumulated skill experience
     * @typedef {Object.<string, number>} Koviko.Predictor~Skills
     */

    /**
     * Accumulated resources
     * @typedef {Object.<string, number>} Koviko.Predictor~Resources
     */

    /**
     * Accumulated progress
     * @typedef {Object.<string, Koviko.Predictor~Progression>} Koviko.Predictor~Progress
     */

    /**
     * State object
     * @typedef {Object} Koviko.Predictor~State
     * @prop {Koviko.Predictor~Stats} stats Accumulated stat experience
     * @prop {Koviko.Predictor~Skills} skills Accumulated skill experience
     * @prop {Koviko.Predictor~Resources} resources Accumulated resources
     * @prop {Koviko.Predictor~Progress} progress Accumulated progress
     */

    /**
     * Create the predictor
     * @param {Koviko~View} view IdleLoops view object
     * @param {Object} actions IdleLoops actions object
     * @param {Array.<Koviko~ListedAction>} actions.next Action List
     * @param {HTMLElement} container Action list container
     */
    constructor(view, actions, container) {
      // Initialization steps broken into pieces, for my sake
      this.initStyle();
      this.initElements()
      this.initPredictions();
      this.state;
      Koviko.options={};
      if(typeof localStorage !== "undefined") {
        Koviko.options.timePrecision=localStorage.getItem('timePrecision');
        if (Koviko.options.timePrecision !== null) {
          \$('#updateTimePrecision').val(Koviko.options.timePrecision);
        }
        Koviko.options.actionWidth=localStorage.getItem("actionWidth");
        if (Koviko.options.actionWidth!==null) {
          document.getElementById("actionsColumn").style.width=Koviko.options.actionWidth+"px";
          document.getElementById("nextActionsListContainer").style.width=(Koviko.options.actionWidth-120)+"px";
          \$('#actionWidth').val(Koviko.options.actionWidth);
        }
        Koviko.options.repeatPrediction=localStorage.getItem("repeatPrediction")=='true';
        if (Koviko.options.repeatPrediction!==null) {
          \$('#repeatPrediction').prop( "checked", Koviko.options.repeatPrediction);
        }
        let tmpVal=localStorage.getItem("trackedStat");
        if (tmpVal) {
          \$('#trackedStat').val(tmpVal);
          Koviko.options.trackedStat=[tmpVal.charAt(0),tmpVal.slice(1)];
        } else {
          \$('#trackedStat').val('Rsoul');
          Koviko.options.trackedStat=['R','soul'];
        }

        Koviko.options.slowMode=localStorage.getItem("slowMode")=='true';
        if (Koviko.options.slowMode!==null) {
          \$('#slowMode').prop( "checked", Koviko.options.slowMode);
        }

        Koviko.options.slowTimer=(localStorage.getItem('slowTimer')||1);
        if (Koviko.options.slowTimer !== null) {
          \$('#updateTimePrecision').val(Koviko.options.slowTimer);
        }

      }
      // Prepare \`updateNextActions\` to be hooked
      if (!view._updateNextActions) {
        view._updateNextActions = view.updateNextActions;
      }

      // Hook \`updateNextActions\` with the predictor's update function
      view.updateNextActions = () => {
        this.preUpdate(container)
        view._updateNextActions();
        this.update(actions.next, container);
      };

      // Prepare stopGame to be hooked
      if (typeof _stopGame == "undefined") {
        var _stopGame = stopGame;
      }

      // Hook stopGame with the predictor's update function
      stopGame = () => {
        _stopGame()
        view.updateNextActions();
      };

      //Hook checkbox repeatLastActionInput with the predictor's update function
      repeatLastActionInput.addEventListener('change',e =>{
        view.updateNextActions();
      });
      view.updateNextActions();

    }

    /**
     * Run a fake action list containing every possible action so that, hopefully, every function is ran at least once.
     * @memberof Koviko.Predictor
     */
    test() {
      const actions = [];

      for (const name in this.predictions) {
        actions.push({ name: name, loops: 100 });
      }

      this.update(actions, null, true);
    }

    /**
     * Build the style element responsible for the formatting of the predictor's values.
     * @memberof Koviko.Predictor
     */
    initStyle() {
      // Get the style element if it already exists for some reason
      let style = document.getElementById('koviko');

      // Build the CSS
      let css = \`
      .nextActionContainer { width: auto!important; padding-left:4px; padding-right: 4px; grid-template: "a b . c" / auto auto 1fr auto }
      .nextActionContainer[style~='flex;'] {display: grid!important;}
      .nextActionContainer > div:first-child { width: 90px; }
      .nextActionContainer > div:nth-child(2) {text-align: right; grid-area: c }
      .koviko.valid, .koviko.invalid  { grid-area: b;pointer-events:auto }
      #nextActionsList{height:100%!important; overflow-y:scroll;}
      #curActionsListContainer{width:120px!important; z-index: 100;}
      #nextActionsList:hover{margin-left:-40%;padding-left:40%}
      #actionList>div:nth-child(2){left: 53px !important}
      #nextActionsList.disabled ul.koviko{display:none;}
      .nextActionContainer:nth-child(1n+9) .showthis {bottom: 5px; top: unset;}
      span.koviko{font-weight:bold;color:#8293ff;}
      div.koviko{top:-5px;left:auto;right:100%}
      ul.koviko{list-style:none;margin:0;padding:0;pointer-events:none;display:inline;}
      ul.koviko li{display:inline-block;margin: 0 2px;font-weight:bold;font-size:90%}
      ul.koviko.invalid li{color:#c00!important}
      ul.koviko.expired li, .expired .koviko{color:#777!important}
      ul.koviko .mana{color:#8293ff}
      ul.koviko .manaBought{color:#6371ca}
      ul.koviko .gold{color:#d09249}
      ul.koviko .rep{color:#b06f37}
      ul.koviko .soul{color:#9d67cd}
      ul.koviko .herbs{color:#4caf50}
      ul.koviko .hide{color:#663300}
      ul.koviko .potions{color:#00b2ee}
      ul.koviko .darkPotions{color:#00b2ee}
      ul.koviko .lpotions{color:#436ef7}
      ul.koviko .blood{color:#8b0000}
      ul.koviko .crafts{color:#777777}
      ul.koviko .adventures{color:#191919}
      ul.koviko .ritual{color:#ff1493}
      ul.koviko .artifacts{color:#ffd700}
      ul.koviko .mind{color:#006400}
      ul.koviko .stone{color:#ff0000}
      ul.koviko .heroism{color:#ff0000}
      ul.koviko .power{color:#0000ff}
      ul.koviko .map{color:#2ea9bd}
      ul.koviko .completedMap{color:#45e5ff}
      ul.koviko .finLoops{color:#777777}
      ul.koviko .magicFight{color:#8A2BE2}
      ul.koviko .magicFighterStrenght{color:#FF00FF}
      \`;
      document.getElementById("actionsColumn").style.width="500px";
      document.getElementById("nextActionsListContainer").style.width="380px";

      // Create the <style> element if it doesn't already exist
      if (!style || style.tagName.toLowerCase() !== 'style') {
        style = document.createElement('style');
        style.type = 'text/css';
        style.id = 'koviko';
        document.head.appendChild(style);
      }

      // Clean out the <style> element and append the correct CSS
      for (; style.lastChild; style.removeChild(style.lastChild));
      style.appendChild(document.createTextNode(css));
    }

    /**
     * Build the element that shows the total mana required by the action list.
     * @memberof Koviko.Predictor
     */
    initElements() {
      // Find the display element for the total if it already exists
      let parent = document.getElementById('actionList').firstElementChild;

      /**
       * Element that displays the total amount of mana used in the action list
       * @member {HTMLElement}
       */
      this.totalDisplay = [...parent.children].reduce((total, el, i, arr) => total || el.className === 'koviko' && el, false);

      // If the element doesn't already exist, create it
      if (!this.totalDisplay) {
        this.totalDisplay = document.createElement('span');
        this.totalDisplay.className = 'koviko';
        this.totalDisplay.style='padding-left: 50px';
        parent.appendChild(this.totalDisplay);

        this.statisticDisplay =document.createElement('span');
        this.statisticDisplay.className = 'koviko';
        parent.appendChild(this.statisticDisplay);
      }

      //Adds more to the Options panel
      \$('#menu div:nth-child(4) .showthisH').append("<div id='preditorSettings'><br /><b>Predictor Settings</b></div>")
      \$('#preditorSettings').append("<br /><label>Degrees of precision on Time</label><input id='updateTimePrecision' type='number' value='1' min='0' max='10' style='width: 50px;'>");
      \$('#updateTimePrecision').focusout(function() {
          if(\$(this).val() > 10) {
              \$(this).val(10);
          }
          if(\$(this).val() < 1) {
              \$(this).val(1);
          }
          Koviko.options.timePrecision=\$(this).val();
          localStorage.setItem('timePrecision', Koviko.options.timePrecision);
      });
      \$('#preditorSettings').append("<br /><label>Width of the Action List</label><input id='actionWidth' type='number' value='500' min='100' max='4000' style='width: 50px; margin-left:40px'>");
      \$('#actionWidth').focusout(function() {
          Koviko.options.actionWidth=\$(this).val();
          localStorage.setItem('actionWidth',Koviko.options.actionWidth );
          document.getElementById("actionsColumn").style.width=Koviko.options.actionWidth+"px";
          document.getElementById("nextActionsListContainer").style.width=(Koviko.options.actionWidth-120)+"px";
      });

      \$('#preditorSettings').append(\`<br /><input id='repeatPrediction' type='checkbox'><label for='repeatPrediction'> "Repeat last action on list" applies to the Predictor</label>\`);
      \$('#repeatPrediction').change(function() {
          Koviko.options.repeatPrediction=\$(this).is(':checked');
          localStorage.setItem('repeatPrediction',Koviko.options.repeatPrediction );
      });

      \$('#actionChanges').children('div:nth-child(2)').append("<select id='trackedStat' class='button'></select>");
      \$('#trackedStat').append("<option value=Rsoul hidden=''>(R) Soulstones</option>");
      \$('#trackedStat').append("<option value=Ract hidden=''>(R) Final Actions</option>");
      \$('#trackedStat').append("<option value=Rsurvey hidden=''>(R) Surveys</option>");
      for (let i in skillList) {
        \$('#trackedStat').append("<option value=S"+skillList[i]+" hidden=''>(S) "+skillList[i]+"</option>");
      }
      for (let i in skillSquirrelList) {
        \$('#trackedStat').append("<option value=Q"+skillSquirrelList[i]+"_squirrel hidden=''>(Q) "+skillSquirrelList[i]+"</option>");
      }
      for (let i in statList) {
        \$('#trackedStat').append("<option value=T"+statList[i]+" >(T) "+_txt('stats>'+statList[i]+'>long_form')+"</option>");
      }
      \$('#trackedStat').change(function() {
        let tmpVal=\$(this).val();
        localStorage.setItem('trackedStat',tmpVal);
        Koviko.options.trackedStat=[tmpVal.charAt(0),tmpVal.slice(1)];
        view.updateNextActions();
      });
      this.updateTrackedList();

      \$('#preditorSettings').append(\`<br /><input id='slowMode' type='checkbox'><label for='slowMode'> Only update the predictor every <input id='slowTimer' type='number' value='1' min='0'style='width: 20px;'> Minutes</label>\`);
      \$('#slowMode').change(function() {
          Koviko.options.slowMode=\$(this).is(':checked');
          localStorage.setItem('slowMode',Koviko.options.slowMode );
      });

      \$('#slowTimer').focusout(function() {
          if(\$(this).val() < 1) {
              \$(this).val(1);
          }
          Koviko.options.slowTimer=\$(this).val();
          localStorage.setItem('slowTimer', Koviko.options.slowTimer);
      });


    }

    updateTrackedList() {
      let statisticList = $("#trackedStat").children();
        for (let i=0;i<statisticList.length;i++) {
          switch(statisticList[i].value.charAt(0)) {
            case 'R':
              statisticList[i].hidden=((statisticList[i].value=="Rsurvey") && (getExploreSkill()==0));
              break;
            case 'S':
              statisticList[i].hidden=(!skills[statisticList[i].value.slice(1)].exp>0);
              break;
            case 'Q':
              statisticList[i].hidden=(!skillsSquirrel[statisticList[i].value.substring(1,statisticList[i].value.indexOf("_squirrel"))].exp>0);
              break;
            case 'T':
              break;
          }
        }
    }

    /**
     * Build all of the necessary components to make predictions about each action.
     * @memberof Koviko.Predictor
     */
    initPredictions() {
      /**
       * Helper methods
       * @member {Object.<string, function>}
       * @namespace
       */
      this.helpers = (this.helpers || {
        /**
         * Get the level of a town attribute.
         * @param {number} exp Amount of experience in the town attribute
         * @return {number} Current level of town attribute
         * @memberof Koviko.Predictor#helpers
         */
        getTownLevelFromExp: (exp) => Math.min(Math.floor((Math.sqrt(8 * exp / 100 + 1) - 1) / 2),100),

        /**
         * Get the current guild rank's bonus, noting that there is a max of 15 ranks, base zero.
         * @param {Koviko.Predictor~Resources} r Accumulated resources
         * @return {number} Current bonus from guild rank
         * @memberof Koviko.Predictor#helpers
         */
        getGuildRankBonus: (guild) => guild>= 27 ? 10 : Math.floor(1 + guild / 3) + (guild%3) * 0.25,

        /**
         * Calculate the bonus given by "Wizard College"
         * @param {Koviko.Predictor~Resources} r Accumulated resources
         * @param {Koviko.Predictor~Skills} k Accumulated skills
         * @return {number} Bonus Multiplier of the Wizard College
         * @memberof Koviko.Predictor#helpers
         */
        getWizardRankBonus: (r) => ((r.wizard >= 63) ? 5 : precision3(1 + 0.02 * Math.pow((r.wizard||0), 1.05))),

        getSkillBonusInc: (exp) => (Math.pow(1 +  getSkillLevelFromExp(exp) / 60, 0.25)),

        getSkillBonusDec: (exp) => (1 / (1 +  getSkillLevelFromExp(exp) / 100)),

        /**
         * Calculate the ArmorLevel specifically affecting the team leader
         * @param {Koviko.Predictor~Resources} r Accumulated resources
         * @param {Koviko.Predictor~Skills} k Accumulated skills
         * @return {number} Armor Multiplier for the Self Combat Calculation
         * @memberof Koviko.Predictor#helpers
         */
        getArmorLevel: (r, k) => (1 + (((r.armor||0) + 3 * (r.enchantments||0)) * (r.crafts?h.getGuildRankBonus(r.crafts):1) ) / 5),

        /**
         * Calculate the combat skill specifically affecting the team leader
         * @param {Koviko.Predictor~Resources} r Accumulated resources
         * @param {Koviko.Predictor~Skills} k Accumulated skills
         * @return {number} Combat skill of the team leader
         * @memberof Koviko.Predictor#helpers
         */
        getSelfCombat: (r, k) => ( getSkillLevelFromExp(k.combat) +  getSkillLevelFromExp(k.pyromancy) * 5) * h.getArmorLevel(r,k) * (1 + getBuffLevel("Feast") * 0.05),

        //getZombieStrength: (r, k) => ( getSkillLevelFromExp(k.dark) * (r.zombie||0) / 2 * Math.max(getBuffLevel("Ritual") / 100, 1)) * (1 + getBuffLevel("Feast") * 0.05),

        getTeamStrength: (r, k) => (( getSkillLevelFromExp(k.combat) +  getSkillLevelFromExp(k.restoration) * 2) * ((r.team||0) / 2) * (r.adventures?h.getGuildRankBonus(r.adventures):1)),

        getTeamCombat: (r, k) => (h.getSelfCombat(r, k)/200 * Math.pow(200,r.teamMembers) * (1+getSkillLevelFromExp(k.teamwork)/10)),

        getRewardSS: (dNum) => Math.floor(Math.pow(10, dNum) * Math.pow(1 + getSkillLevel("Divine") / 60, 0.25)),

        getStatProgress: (p, a, s, offset, factor) => (1 +  getLevelFromExp(s[a.loopStats[(p.completed + offset) % a.loopStats.length]]) / factor),

        getTrialCost: (p, a) => segment => precision3(Math.pow(a.baseScaling, Math.floor((p.completed + segment) / a.segments + .0000001)) * a.exponentScaling * getSkillBonus("Assassin")),

        killSquirrel: (r)=>(r.squirrel=0,r.deadSquirrel=1)
      });

      // Initialise cache

      this.cache = new Koviko.Cache();
      if(typeof(structuredClone) !== 'function'){
        console.log('Predictor: This browser does not support structuredClone, disabling the cache');
        this.cache.reset = function(x) {return false;};
        this.cache.add = function(x, y) {};
      }

      // Alias the globals to a shorter variable name
      const g = Koviko.globals;
      const h = this.helpers;

      //assassin base
      const assassinBase={ affected: ['heart','rep'], loop: {
          max: () => 1,
          cost: (p) => segment => 50000000,
          tick: (p, a, s, k, r) => offset => {
            if ((p.completed / a.segments + .0000001)>=1) {
              return 0;
            }
            let baseSkill = Math.sqrt( getSkillLevelFromExp(k.practical)) +  getSkillLevelFromExp(k.thievery) +  getSkillLevelFromExp(k.assassin);
            let loopStat = (1 +  getLevelFromExp(s[a.loopStats[(p.completed + offset) % a.loopStats.length]]) / 1000);
            let completions = Math.sqrt(1 + p.total / 100);
            let reputationPenalty = (Math.abs(r.rep)|| 1);
            let killStreak = (r.heart || 1);
            return baseSkill * loopStat * completions / reputationPenalty / killStreak;
          },
          effect: { loop: (r) => r.heart++, end: (r,k) => ( r.rep+=Math.min((r.town + 1) * -250 +  getSkillLevelFromExp(k.assassin), 0))},
        }};

      const surveyBase={affected:['map','completedMap'],canStart:(input)=>(input.map>0),effect:(r)=>(r.map--,r.completedMap++)};

      /**
       * Prediction parameters
       * @type {Object.<string, Koviko.Prediction~Parameters>}
       */
      const predictions = {




 

        'RuinsZ1':{ affected:['']},
        'RuinsZ3':{ affected:['']},
        'RuinsZ5':{ affected:['']},
        'RuinsZ6':{ affected:['']},
        'HaulZ1':{ affected:['stone'],
          canStart:(input)=>((input.stone||0)<1 && stonesUsed[1] < 250),
          effect:(r) => {
          let t=towns[1]; //Area of the Action
          if (t.goodStonesZ1>0) {
            r.stone=1;
            return;
          }
          if (t.totalStonesZ1<=(t.checkedStonesZ1+(r.stoneCheckedZ1||0))) {
            return; //No more stones to check..
          }
          r.stoneCheckedZ1=(r.stoneCheckedZ1||0)+1;
          if (((t.checkedStonesZ1+r.stoneCheckedZ1)%1000)==0) {
            r.stone=1;
          }
        }},
        'HaulZ3':{ affected:['stone'],
          canStart:(input)=>((input.stone||0)<1 && stonesUsed[3] < 250),
          effect:(r) => {
          let t=towns[3]; //Area of the Action
          if (t.goodStonesZ3>0) {
            r.stone=1;
            return;
          }
          if (t.totalStonesZ3<=(t.checkedStonesZ3+(r.stoneCheckedZ3||0))) {
            return; //No more stones to check..
          }
          r.stoneCheckedZ3=(r.stoneCheckedZ3||0)+1;
          if (((t.checkedStonesZ3+r.stoneCheckedZ3)%1000)==0) {
            r.stone=1;
          }
        }},
        'HaulZ5':{ affected:['stone'],
          canStart:(input)=>((input.stone||0)<1 && stonesUsed[5] < 250),
          effect:(r) => {
          let t=towns[5]; //Area of the Action
          if (t.goodStonesZ5>0) {
            r.stone=1;
            return;
          }
          if (t.totalStonesZ5<=(t.checkedStonesZ5+(r.stoneCheckedZ5||0))) {
            return; //No more stones to check..
          }
          r.stoneCheckedZ5=(r.stoneCheckedZ5||0)+1;
          if (((t.checkedStonesZ5+r.stoneCheckedZ5)%1000)==0) {
            r.stone=1;
          }
        }},
        'HaulZ6':{ affected:['stone'],
          canStart:(input)=>((input.stone||0)<1 && stonesUsed[6] < 250),
          effect:(r) => {
          let t=towns[6]; //Area of the Action
          if (t.goodStonesZ6>0) {
            r.stone=1;
            return;
          }
          if (t.totalStonesZ6<=(t.checkedStonesZ3+(r.stoneCheckedZ6||0))) {
            return; //No more stones to check..
          }
          r.stoneCheckedZ6=(r.stoneCheckedZ6||0)+1;
          if (((t.checkedStonesZ6+r.stoneCheckedZ6)%1000)==0) {
            r.stone=1;
          }
        }},
        'Look Around':{ affected:[''],
          canStart:(input) => (input.glasses)},
        'Absorb Mana':{ affected:[''],
          canStart:true,
          effect:(r,k,sq) => {
          if (sq) return;
          const manaBase = 100000;
          const exponent = 1 + (getBuffLevel("SpiritBlessing") * 0.02);
          r.manaAbsorb = (r.manaAbsorb || 0)+1;
          r.mana += r.manaAbsorb <= towns[SANCTUARY].goodManaSpots ?  Math.floor(manaBase * Math.pow(exponent, r.manaAbsorb -1)) : 0;
        }},
        'Imbue Squirrel':{ affected:['ImbueSoulStone'],
          effect:(r,k,sq) => {
            k.magic_squirrel+=Math.pow(4, getBuffLevel("SpiritBlessing")- (sq?1:0));
        }},
        'Imbue Soulstones':{ affected:[''],
          canStart:(input) => {
          return Action.ImbueSoulstones.getMinimumSoulstones();
        },
          effect:(r,k,sq) => {
          if (sq) return;
          r.ImbueSoulStone+=1;
        }},
        'Balance Soulstones':{ affected:[''],
          canStart:true},
        'Mysterious Voice':{ affected:['blessing'],
          canStart:true,
          effect:(r,k,sq) => {
		  switch(getBuffLevel("SpiritBlessing")){
            case 0: r.blessing+=1;
            case 1: if(sq) r.blessing+=1;
            case 2: if(r.stolenGoods >= 10) r.blessing+=1;
            case 3: if(r.herbs >= 100) r.blessing+=1;
            case 4: break;
          }
        }},
        'Wander':{ affected:[''],
          canStart:true,
          effect:(r,k,sq)=>{
          if (sq && getLevelSquirrelAction("Wander")<=1)
            h.killSquirrel(r);
        }},
        'Smash Pots':{ affected:['mana'],
          canStart:true,
          effect:(r,k,sq) => {
          if (sq && getLevelSquirrelAction("Smash Pots")<3) {
            return; //No effect
          }
          r.temp1 = (r.temp1 || 0) + 1;
          r.mana += r.temp1 <= towns[0].goodPots ?  Action.SmashPots.goldCost() : 0;
        }},
        'Pet Squirrel':{ affected:[''], manaCost:(r,k,sq) => {
          if(sq && getLevelSquirrelAction("Pet Squirrel") >= 3) return 2500;
          return 100 + getSkillSquirrelLevelFromExp(k.trust_squirrel) * 100;
        },
          canStart:(input,sq) => {
          if(sq){
		    if(getLevelSquirrelAction("Pet Squirrel") >= 3) return (input.rep >= 2)
            return true;
          }
          if(getLevelSquirrelAction("Pet Squirrel") >= 2 && !input.squirrel ) return false;
          if(getLevelSquirrelAction("Pet Squirrel") < 2 && !input.squirrel && input.deadSquirrel) return false;
		return true;
        },
          effect:(r,k,sq) => {
          if (sq) {
            if (getLevelSquirrelAction("Pet Squirrel")>=3) {
              k.trust_squirrel+=200;
            }
          } else {
            k.trust_squirrel+=100;
            r.squirrel=1;
          }
        }},
        'Pick Locks':{ affected:['gold','stolenGoods','mana'],
          canStart:true,
          effect:(r,k,sq) => {
          if (sq) {
            if (getLevelSquirrelAction("Pick Locks")>=2) {
              r.temp2 = (r.temp2 || 0) + 1;
              r.mana += r.temp2 <= towns[0].goodLocks ? Action.PickLocks.stolenGoodsGain() * Action.PickLocks.goldCost() : 0;
            } else {
              h.killSquirrel(r);
            }
          } else {
            r.temp2 = (r.temp2 || 0) + 1;
            r.stolenGoods += r.temp2 <= towns[0].goodLocks ? Action.PickLocks.stolenGoodsGain() : 0;
        }}},
        'Take Glasses':{ affected:['stolenGoods'],
          canStart:(input) => (input.stolenGoods >= 1),
          effect:(r,k,sq) => {
          if (!sq) r.glasses = true;
          r.stolenGoods-=1;
        }},
        'Found Glasses':{ affected:[''],
          effect:(r,k) => {
          r.glasses = true;
        }},
        'Buy Mana Z1':{ affected:['mana','gold','stolenGoods'],
          canStart:true,
          effect:(r,k, sq) => {
          if (sq) {
            switch(getLevelSquirrelAction("Buy Mana Z1")) {
              case 3:
                r.mana+=1400;
              case 2:
                r.mana+=100;
                h.killSquirrel(r);
              case 1:
            }
          }
          r.gold+=r.stolenGoods * Action.BuyManaZ1.stolenGoodsValue()
          r.mana += r.gold *  Action.BuyManaZ1.goldCost();
          r.gold = 0;
          r.stolenGoods=0;
          
        }},
        'Meet People':{ affected:[''],
          canStart:true},
        'Train Strength':{ affected:[''],
          canStart:true},
        'Short Quest':{ affected:['gold'],
          canStart:true,
          effect:(r,k,sq) => {
          let gCost=Action.ShortQuest.goldCost();
          if (sq) {
            switch(getLevelSquirrelAction("Short Quest")) {
              case 1: 
                return;
              case 3:
                gCost=gCost*1.1;
            }
          }
          r.temp3 = (r.temp3 || 0) + 1;
          r.gold += r.temp3 <= towns[0].goodSQuests ?  gCost : 0;
        }},
        'Investigate':{ affected:[''],
          canStart:true},
        'Long Quest':{ affected:['gold','rep'],
          canStart:true,
          effect:(r,k,sq) => {
          r.temp4 = (r.temp4 || 0) + 1;
          if (r.temp4 <= towns[0].goodLQuests) {
            let goldGain=Action.LongQuest.goldCost();
            let repGain=1;
            if (sq) {
              switch(getLevelSquirrelAction("Long Quest")) {
                case 0:
                case 1:
                  return;
                case 2:
                  goldGain*=1.1;
                  repGain=0;
                  break;
                case 3:
                  goldGain*=1.2;
                  break;
              }
            }
            r.gold += goldGain;
            r.rep += repGain;
          }
        }},
        'Throw Party':{ affected:['rep'],
          canStart:(input)=>(input.rep>=2),
          effect:(r,k,sq)=>{
            r.rep-=2;
          }},
        'Warrior Lessons':{ affected:[''],
          canStart:(input) => input.rep >= 2,
          effect:(r, k, sq) => {
          if (sq) {
            if (getLevelSquirrelAction("Warrior Lessons")<=1) {
              return; 
            } else {
              k.combat += ((getLevelSquirrelAction("Warrior Lessons")>=3)?1000:300)*(1+getBuffLevel("Heroism") * 0.02)
              h.killSquirrel(r);
            }
          } else {
            k.combat += 100*(1+getBuffLevel("Heroism") * 0.02)
          }
        }},
        'Mage Lessons':{ affected:[''],
          canStart:(input) => input.rep >= 2,
          effect:(r, k, sq) => { 
          if (sq) {
            if (getLevelSquirrelAction("Mage Lessons")<=1) {
              return; 
            } else {
              k.magic += ((getLevelSquirrelAction("Mage Lessons")>=3)?1000:300);
              h.killSquirrel(r);
            }
          } else {
            k.magic += 100;
          }
        }},
        'Heal The Sick':{ affected:['rep'],
          canStart:(input,sq) => {
      if (sq) {
        if (input.alreadyHealed) return false;
      }
      return input.rep >= 1;
    }, loop: {
          cost:(p, a) => segment =>  fibonacci(2 + Math.floor((p.completed + segment) / a.segments + .0000001)) * 10000,
          tick:(p, a, s, k, r, sq, lCost) => offset =>  sq ?  Math.max(getLevelSquirrelAction("Heal The Sick")-1,0) * lCost(offset) * 3 / a.manaCost() : getSkillLevelFromExp(k.magic) * Math.max( getSkillLevelFromExp(k.restoration) / 50, 1) * h.getStatProgress(p, a, s, offset, 100) * Math.sqrt(1 + p.total / 100),
          effect:{ end:(r,k,sq)=>{if (sq) r.alreadyHealed=true;}, loop:(r,k,sq) => {r.rep += 3; k.magic+=(sq?150:50);}}
        }},
        'Fight Monsters':{ affected:['gold'],
          canStart:(input,sq) => {
      if (sq) {
        if (input.alreadyFought) return false;
      }
      return input.rep >= 2;
    }, loop: {
          cost:(p, a) => segment =>  fibonacci(Math.floor((p.completed + segment) - p.completed / a.segments + .0000001)) * 20000,
          tick:(p, a, s, k, r, sq, lCost) => offset => sq ? Math.max(getLevelSquirrelAction("Fight Monsters")-1,0) * lCost(offset) * 3 / a.manaCost() : h.getSelfCombat(r, k) * Math.sqrt(1 + p.total / 100) * h.getStatProgress(p, a, s, offset, 100),
          effect:{ end:(r, k, sq) => {
          if (sq) {
            if (getLevelSquirrelAction("Fight Monsters")<2) {
              h.killSquirrel(r);
            } else {
              r.alreadyFought=true;
            }
          }
        }, segment:(r,k) => (r.gold += 20,k.combat += 50*(1+getBuffLevel("Heroism") * 0.02))}
        }},
        'Training Dummy':{ affected:['magicFight'],
          canStart:(input,sq) => {
			return ((!sq || input.squirrel) && input.rep >= 2);
        }, loop: {
          max:()=>3,
          cost:(p) => segment =>  precision3(Math.floor(Math.pow(3, p.completed/9)+0.0000001)*60000),
          tick:(p, a, s, k, r, sq) => offset => {
            let floor = Math.floor(p.completed / a.segments + .0000001);
            if (sq) {
               return  0;//Math.max((getLevelSquirrelAction("Small Dungeon")-1),0)/2 * lCost(offset) * 7 / a.manaCost();
            }
            if (floor>=3) return 0;
            return (h.getSelfCombat(r, k) +  getSkillLevelFromExp(k.magic)) * h.getStatProgress(p, a, s, offset, 100) *  Math.sqrt(1 + towns[BEGINNERSVILLE].totalTDummy / 100);
    },
          effect:{ end:(r,k) => {
      if(r.trainLoop>=3) r.magicFight=1;
    }, segment:(r,k) => {
      k.combat+=25;
      k.magic+=25;
    }, loop:(r,k) => {
      k.combat+=25;
      k.magic+=25;
      r.trainLoop=(r.trainLoop||0)+1;
    }}
        }},
        'Magic Fighter':{ affected:['magicFight'],
          canStart:(input) => {
          return input.rep>=2;
        }, loop: {
          max:()=>magicFighterStrenght,
          cost:(p) => segment =>  precision3(Math.floor(Math.pow(5, p.completed/9)+ 0.0000001)*275000),
          tick:(p, a, s, k, r, sq) => offset => sq ? 0 : (h.getSelfCombat(r, k) +  getSkillLevelFromExp(k.magic)) * h.getStatProgress(p, a, s, offset, 200) * Math.sqrt(1 + p.total / 200),
          effect:{ end:(r,k)=> {
       if (r.magicLoop>=magicFighterStrenght) r.magicFight=1;
    }, segment:(r,k) => {k.combat += 75; k.magic += 75;}, loop:(r,k) => {k.combat += 75; k.magic += 75;r.magicLoop=(r.magicLoop||0)+1;}}
        }},
        'Small Dungeon':{ affected:['soul'],
          canStart:(input,sq) => {
      if (sq) {
        if (input.alreadySDungeon) return false;
      }
      return input.rep >= 2;
    }, loop: {
          max:(a) =>  dungeons[a.dungeonNum].length,
          cost:(p, a) => segment =>  precision3(Math.pow(2.5, Math.floor((p.completed + segment) / a.segments + .0000001)) * 30000),
          tick:(p, a, s, k, r, sq, lCost) => offset => {
            let floor = Math.floor(p.completed / a.segments + .0000001);
            if (sq) {
               return  Math.max((getLevelSquirrelAction("Small Dungeon")-1),0)/2 * lCost(offset) * 7 / a.manaCost();
            }
            return floor in  dungeons[a.dungeonNum] ? (h.getSelfCombat(r, k) +  getSkillLevelFromExp(k.magic)) * h.getStatProgress(p, a, s, offset, 100) * Math.sqrt(1 +  dungeons[a.dungeonNum][floor].completed / 200) : 0;
          },
          effect:{ end:(r,k,sq)=>{if (sq) r.alreadySDungeon=true;}, loop:(r,k) => {r.soul+=h.getRewardSS(0);k.combat += 100*(1+getBuffLevel("Heroism") * 0.02); k.magic += 100;}}
        }},
        'Buy Supplies':{ affected:['gold'],
          canStart:(input,sq) => sq || (input.gold >= 450 - Math.max((input.supplyDiscount || 0) * 30, 0)),
          effect:(r,k,sq) => {
            if (sq) return;
            r.gold -= 450 - Math.max((r.supplyDiscount || 0) * 30, 0);
            r.supplies = (r.supplies || 0) + 1;
          }},
        'Haggle':{ affected:['rep'],
          canStart:(input, sq) => sq ? !input.squirrelHaggle:(input.rep > 0),
          effect:(r,k,sq) => {
          if (sq) {
            if (getLevelSquirrelAction("Haggle")<2) return;
            r.squirrelHaggle=true;
          } else {
            r.rep--;
          }
          r.supplyDiscount = (r.supplyDiscount >= 15 ? 15 : (r.supplyDiscount || 0) + 1)
}},
        'Start Journey':{ affected:[''],
          canStart:r => r.supplies >= 1,
          effect:(r,k,sq) => {
            r.supplies = 0;
            r.town =sq ? SANCTUARY : FORESTPATH;
          }},
        'Hitch Ride':{ affected:[''],
          canStart:true,
          effect:(r,k) => ( r.town =2)},
        'Open Rift':{ affected:[''],
          effect:(r,k) => (r.supplies = 0, r.town =5, k.dark+=1000)},
        'Explore Forest':{ affected:[''],
          canStart:true,
          effect:(r,k,sq)=>{if (sq && getLevelSquirrelAction("Explore Forest")<=1) h.killSquirrel(r)}},
        'Wild Mana':{ affected:['mana'],
          canStart:true,
          effect:(r,k,sq) => {
          r.temp5 = (r.temp5 || 0) + 1;
          const sqBonus= (sq &&getLevelSquirrelAction("Wild Mana")>=2) ? 100:0;
          r.mana += r.temp5 <= towns[FORESTPATH].goodWildMana ?  Action.WildMana.goldCost()+sqBonus : 0;
        }},
        'Gather Herbs':{ affected:['herbs'],
          canStart:true,
          effect:(r,k,sq) => {
          r.temp6 = (r.temp6 || 0) + 1;
          if (r.temp6 > towns[FORESTPATH].goodHerbs) return; // no herbs left
          if (sq) {
            switch(getLevelSquirrelAction("Gather Herbs")) {
              case 0:
              case 1:
                return;
              case 2:
                r.mana+=200
                return;
              case 3:
                r.mana+=275
                return;
            }
          } else {
            r.herbs += 1;
          }
        }},
        'Hunt':{ affected:['hide'],
          canStart:true,
          effect:(r,k,sq) => {
          if (sq && getLevelSquirrelAction("Hunt")<2) {
            h.killSquirrel(r);
            return;
          }
          r.temp7 = (r.temp7 || 0) + 1;
          r.hide += r.temp7 <= towns[FORESTPATH].goodHunt ? 1 : 0;
        }},
        'Sit By Waterfall':{ affected:[''],
          canStart:true,
          effect:(r,k,sq)=>sq?h.killSquirrel(r):0},
        'Old Shortcut':{ affected:[''],
          canStart:true,
          effect:(r,k,sq)=>(sq && getLevelSquirrelAction("Old Shortcut")<2)?h.killSquirrel(r):0},
        'Talk To Hermit':{ affected:[''],
          canStart:true,
          effect:(r,k,sq)=>(sq && getLevelSquirrelAction("Talk To Hermit")<2)?h.killSquirrel(r):0},
        'Practice Yang':{ affected:['rep'],
          canStart:true,
          effect:(r,k,sq) => {
          if (sq) {
            if (getLevelSquirrelAction("Practice Yang")>=2) {
              h.killSquirrel(r);
              r.rep+=4;
            }
          } else {
            k.yang+=100 + (r.rep >= 0 ? r.rep * 25 : 0);
          }
        }},
        'Learn Alchemy':{ affected:['herbs'],
          canStart:(input) => (input.herbs >= 10),
          effect:(r, k, sq) => {
            if (sq) return;
            r.herbs -= 10;
            k.alchemy += 10 + 10 * getSkillLevelFromExp(k.brewing);
          }},
        'Distill Potions':{ affected:['herbs','potions'],
          canStart:(input) => {
          return (input.herbs>=10 && input.rep>=10);
        }, loop: {
          cost:(p) => segment =>  Math.floor(Math.pow(1.3, p.completed/3)+0.0000001)*20000,
          tick:(p, a, s, k, r,sq) => offset => (r.herbs<10||sq) ? 0 : (getSkillLevelFromExp(k.alchemy) + getSkillLevelFromExp(k.brewing)/2) * h.getStatProgress(p, a, s, offset, 100) * Math.sqrt(1 + p.total / 100),
          effect:{loop:(r,k) => {
            r.herbs-=10;
            r.potions++;
            k.alchemy += 10 + 10 * getSkillLevelFromExp(k.brewing);
            }}
        }},
        'Train Squirrel':{ affected:[''],
          canStart:(input,sq) => input.squirrel,
          effect:(r,k,sq) => {
          let smult=1;
          if (sq) {
            h.killSquirrel(r);
            if (getLevelSquirrelAction("Train Squirrel")>=2) {
              k.combat_squirrel+=getLevelFromExp(k.combat_squirrel)*10;
            }
          } else {
            k.combat_squirrel+=smult * 4* h.getSelfCombat(r, k);
		  }
        }},
        'Feed Animals':{ affected:['herbs'],
          canStart:(input) => {
          return input.herbs>=10;
        },
          effect:(r,k,sq) => {
          if (sq) h.killSquirrel(r);
          r.herbs-=10;
        }},
        'Pot Fairy':{ affected:['rep','mana','herbs'],
          canStart:true,
          effect:(r,k,sq) => {
          if (r.temp1>0) { //Smashed any pots...
            r.rep*=-1;
          } else {
			const multPots = towns[BEGINNERSVILLE].goodPots/10;
			r.rep+=multPots;
			r.mana+=multPots * 2000;
            if (sq) {
              let herbsToGather=towns[FORESTPATH].goodHerbs-(r.temp6||0);
              switch(getLevelSquirrelAction("Pot Fairy")) {
                case 0:
                case 1:
                  return;
                case 2:
                  herbsToGather=Math.min(herbsToGather,100);
                case 3:
                  r.herbs+=herbsToGather;
                  r.temp6=(r.temp6||0)+herbsToGather;
             }
            }
          }
        }},
        'Burn Forest':{ affected:['herbs','darkEssences'],
          canStart:(input) => {
          return (input.rep<0 && input.herbs>=10)
        }, loop: {
          cost:(p) => segment => 75000,
          tick:(p, a, s, k, r, sq) => offset => r.herbs<10 ? 0 : (r.herbs+(sq?10:0)) *  Math.sqrt(h.getStatProgress(p, a, s, offset, 1000)),
          effect:{ end:(r,k,sq)=> {
          if (sq && getLevelSquirrelAction("Burn Forest")<=1) {
            h.killSquirrel(r);
          }
        }, loop:(r,k) => {r.mana+=4500;r.herbs-=10;r.darkEssences+=Math.floor(towns[FORESTPATH].getLevel("DarkForest")/10 + 0.000001);r.forestBurn=(r.forestBurn||0)+1; if(r.forestBurn%2==0) r.rep-=1;}}
        }},
        'Bird Watching':{ affected:[''],
          canStart:(input) => input.glasses},
        'Dark Forest':{ affected:[''],
          canStart:(input) => {
          return input.rep<0;
        },
          effect:(r,k,sq) => {
         if (sq && getLevelSquirrelAction("Dark Forest")<2) h.killSquirrel(r);
        }},
        'Talk To Witch':{ affected:[''],
          canStart:(input)=>(input.rep<0),
          effect:(r,k,sq) => {
         if (sq && getLevelSquirrelAction("Talk To Witch")<2) h.killSquirrel(r);
        }},
        'Practice Yin':{ affected:['rep'],
          canStart:true,
          effect:(r,k,sq) => {
          if (sq) {
            if (getLevelSquirrelAction("Practice Yin")>=2) {
              h.killSquirrel(r);
              r.rep-=4;
            }
          } else {
            k.yin+=100 + (r.rep <= 0 ? r.rep * (-25) : 0);
          }
        }},
        'Learn Brewing':{ affected:['darkEssences'],
          canStart:(input) => {
          return input.darkEssences>=10;
        },
          effect:(r,k,sq) => {
            if (sq) return;
            r.darkEssences-=10;
            k.brewing += 10 + 10 * getSkillLevelFromExp(k.alchemy);
          }},
        'Concoct Potions':{ affected:['rep','darkEssences','darkPotions'],
          canStart:(input) => {
            return (input.rep<=-10 && input.darkEssences>=10);
          }, loop: {
          cost:(p) => segment =>  precision3(Math.pow(1.3, p.completed/3))*25000,
          tick:(p, a, s, k, r, sq) => offset => (sq || r.darkEssences<10)?0: (getSkillLevelFromExp(k.alchemy)/2 + getSkillLevelFromExp(k.brewing)) * h.getStatProgress(p, a, s, offset, 100) * Math.sqrt(1 + p.total / 100),
          effect:{loop:(r,k) => {
            r.darkEssences-=10;
            r.darkPotions++;
            k.brewing += 10 + 10 * getSkillLevelFromExp(k.alchemy);
            }}
        }},
        'Continue On':{ affected:[''],
          canStart:true,
          effect:(r,k,sq) => r.town = (sq?SANCTUARY:MERCHANTON)},
        'Explore City':{ affected:['']},
        'Get Drunk':{ affected:['rep'],
          canStart:(input) => (input.rep > 0),
          effect:(r) => r.rep--},
        'Help Slums':{ affected:['rep'],
          canStart:(input) => (input.rep < 0),
          effect:(r,k,sq) => r.rep++},
        'Gamble':{ affected:['gold','rep'],
          canStart:(input) => {
        input.gamblesInARow=input.gamblesInARow||0;
		let costs = 20 + (input.gamblesInARow*(input.gamblesInARow+1)/2) * 2;
		return input.gold >= costs && input.rep > 0;
    },
          effect:(r) => {
          let wonGamble=false;
          if (! r.gambleActions) {
            r.gambleActions=( r.gambleActions || 0);
            r.gamblesInARow=(r.gamblesInARow||0);
          }
          r.gambleActions++;
          

          if ( r.gambleActions <= towns[MERCHANTON].goodGamble) {
            wonGamble=true; //Normal Success
          } else {
            let totalChecked=r.gambleActions-towns[MERCHANTON].goodGamble+towns[MERCHANTON].checkedGamble
            if ((totalChecked<=towns[MERCHANTON].totalGamble) && (totalChecked%10==0)) {
              wonGamble=true;
            }
          }

          if (wonGamble) {
            r.gamblesInARow++;
            r.gold+=r.gamblesInARow*2;
          } else {
            r.gold-=(20 + gamblesInARow*(gamblesInARow+1));
            r.gamblesInARow=0;
          }
          r.rep-=Math.floor((r.gamblesInARow+5)/10);
          if (r.rep<0) {
            r.rep=0;
          }
        }},
        'Slave Auction':{ affected:['gold','rep'],
          canStart:(input) => {
        let minCost = 70 + input.rep;
		return input.gold >= minCost && input.rep < 0;
        },
          effect:(r,k) => {

		let totalSlaves = towns[MERCHANTON].goodSlaveAuction + (towns[MERCHANTON].totalSlaveAuction - towns[MERCHANTON].checkedSlaveAuction);
		let costPerSlave = Math.max(60 + Math.ceil(r.rep/2), 10);
		let bounty = 75;
		let slavesBought = Math.min(Math.floor(r.gold/costPerSlave),totalSlaves);
		
        r.rep = 0;
		r.gold-=slavesBought*costPerSlave;
        
        if (towns[MERCHANTON].goodSlaveAuction>=slavesBought) {
          r.gold+=slavesBought*bounty;
        } else {
           r.gold+=towns[MERCHANTON].goodSlaveAuction*bounty;
           slavesBought-=towns[MERCHANTON].goodSlaveAuction;
           for (let i = 1; i <= slavesBought; i++){
              if ((i+towns[MERCHANTON].checkedSlaveAuction)%10==0) {
                r.gold+=bounty;
              }
           }

        }
      }},
        'Adventure Guild':{ affected:['gold','adventures'],
          canStart:(input) => (input.guild==''), loop: {
          cost:(p) => segment =>  precision3(Math.pow(1.65, p.completed + segment)) * 175000,
          tick:(p, a, s, k, r) => offset => ((h.getSelfCombat(r, k) +  getSkillLevelFromExp(k.magic)) / 2) * Math.sqrt(h.getStatProgress(p, a, s, offset, 100)) * Math.sqrt(1 + p.total/2),
          effect:{ end:(r) => (r.guild='Adventure'), segment:(r) => (r.adventures++)}
        }},
        'Training Facility':{ affected:['gold','teamMembers','adventures'],
          canStart:(input) => {
          return (input.teamMembers === 0 || input.gold >= 25) && input.guild === "Adventure"
        },
          effect:(r,k) => {
          if (r.teamMembers>0) {
            r.gold-=25;
          }
          let exp = 20;
		  exp = exp * h.getGuildRankBonus(r.adventures);
		  exp = exp * ( 1 + r.teamMembers);
	      k.teamwork+=exp;
        
        }},
        'Gather Team':{ affected:['teamMembers','adventures'],
          canStart:(input) => {
		  let teamLimit = Math.floor (h.getGuildRankBonus(input.adventures) / 2);
          return input.guild === "Adventure" && input.teamMembers < teamLimit;
    },
          effect:(r) => (r.teamMembers++)},
        'Large Dungeon':{ affected:['teamMembers','soul'],
          canStart:(input) => (input.teamMembers>0), loop: {
          max:(a) =>  dungeons[a.dungeonNum].length,
          cost:(p, a) => segment =>  precision3(Math.pow(4, Math.floor((p.completed + segment) / a.segments + .0000001)) * 300000),
          tick:(p, a, s, k, r) => offset => {
            let floor = Math.floor(p.completed / a.segments + .0000001);
            return floor in  dungeons[a.dungeonNum] ? h.getTeamCombat(r, k) * h.getStatProgress(p, a, s, offset, 100) * Math.sqrt(1 +  dungeons[a.dungeonNum][floor].completed / 100) : 0;
          },
          effect:{loop:(r,k) => {
      r.soul +=Math.min(10,Math.floor(10 / (1 +r.teamMembers) * (1 + getSkillLevelFromExp(k.teamwork)/100)));
      k.teamwork+=200;
    }}
        }},
        'Mock Battle':{ affected:['climbingGears'],
          canStart:(input) => {
          return input.guild=="Adventure";
        }, loop: {
          max:(a) => 3,
          cost:(p,a) => segment =>  Math.floor(Math.pow(20, Math.floor((p.completed + segment) / a.segments + .0000001)))*200000,
          tick:(p, a, s, k, r) => offset => getSkillLevelFromExp(k.teamwork) * Math.sqrt(h.getStatProgress(p, a, s, offset, 100)) * Math.sqrt(1 + p.total / 100),
          effect:{loop:(r,k) => {r.climbingGears++}}
        }},
        'Crafting Guild':{ affected:['gold','crafts'],
          canStart:(input) => (input.guild==''), loop: {
          cost:(p) => segment =>  precision3(Math.pow(1.2, p.completed + segment)) * 2e6,
          tick:(p, a, s, k) => offset => ( getSkillLevelFromExp(k.magic) / 2 +  getSkillLevelFromExp(k.crafting)) * h.getStatProgress(p, a, s, offset, 100) * Math.sqrt(1 + p.total / 1000),
          effect:{ end:(r) => (r.guild='crafting'), segment:(r, k) => (r.gold += 10, r.crafts++, k.crafting += 50)}
        }},
        'Craft Armor':{ affected:['hide'],
          canStart:(input) => (input.hide >= 2),
          effect:(r) => (r.hide -= 2, r.armor = (r.armor || 0) + 1)},
        'Apprentice':{ affected:[''],
          canStart:(input) => (input.guild=='crafting'),
          effect:(r, k) => Math.min((r.apprentice = (r.apprentice || towns[2].expApprentice) + 30 * h.getGuildRankBonus(r.crafts || 0),505000), k.crafting += 10 * (1 + h.getTownLevelFromExp(r.apprentice) / 100))},
        'Mason':{ affected:[''],
          canStart:(input) => (input.guild=='crafting'),
          effect:(r, k) => (r.mason = Math.min((r.mason || towns[2].expMason) + 20 * h.getGuildRankBonus(r.crafts || 0),505000), k.crafting += 20 * (1 + h.getTownLevelFromExp(r.mason) / 100))},
        'Architect':{ affected:[''],
          canStart:(input) => (input.guild=='crafting'),
          effect:(r, k) => Math.min((r.architect = (r.architect || towns[2].expArchitect) + 10 * h.getGuildRankBonus(r.crafts || 0),505000), k.crafting += 40 * (1 + h.getTownLevelFromExp(r.architect) / 100))},
        'Delivery Address':{ affected:['magicFighterStrenght'],
          effect:(r,k) => {
          r.magicFighterStrenght=1;
        }},
        'Delivery Address One':{ affected:['magicFight','magicFighterStrenght'],
          effect:(r,k) => {
          if(r.magicFight>0) r.magicFighterStrenght = 2;
        }},
        'Delivery Address Two':{ affected:['magicFight','magicFighterStrenght'],
          effect:(r,k) => {
          if(r.magicFight>0) r.magicFighterStrenght = 3;
        }},
        'Delivery Address Three':{ affected:['magicFight','magicFighterStrenght'],
          effect:(r,k) => {
          if(r.magicFight>0) r.magicFighterStrenght = 4;
        }},
        'Delivery Address Four':{ affected:['magicFight','magicFighterStrenght'],
          effect:(r,k) => {
          if(r.magicFight>0) r.magicFighterStrenght = 5;
        }},
        'Delivery Address Five':{ affected:['magicFight','teamMembers'],
          effect:(r,k) => {
          if(r.magicFight>0) r.teamMembers++;
        }},
        'Buy Mana Z3':{ affected:['mana','gold'],
          effect:(r) => (r.mana += r.gold *  Action.BuyManaZ3.goldCost(), r.gold = 0)},
        'Sell Potions':{ affected:['gold','potions','darkPotions'],
          effect:(r, k) =>  {
       r.gold += r.potions * 100+r.darkPotions*100;
       r.potions = 0;
       r.darkPotions=0;
    }},
        'Read Books':{ affected:[''],
          canStart:(input) => input.glasses},
        'Tail Judges':{ affected:[''],
          effect:(r,k) => {
          //NYI
        }},
        'Heroes Trial':{ affected:['heroism'],
          canStart:true, loop: {
          max:(a) => trialFloors[a.trialNum],
          cost:(p, a) => segment => precision3(Math.pow(a.floorScaling, Math.floor((p.completed + segment) / a.segments + .0000001)) * a.baseScaling),
          tick:(p, a, s, k, r) => offset => {
            const floor = Math.floor(p.completed / a.segments + .0000001);
            return floor in trials[a.trialNum] ? h.getTeamCombat(r, k) * h.getStatProgress(p, a, s, offset, 100) * Math.sqrt(1 + trials[a.trialNum][floor].completed / 200) : 0;
          },
          effect:{ end:(r,k) => (k.combat+=500*(1+getBuffLevel("Heroism") * 0.02),k.pyromancy+=100*(1+getBuffLevel("Heroism") * 0.02),k.restoration+=100*(1+getBuffLevel("Heroism") * 0.02)), loop:(r) => (r.heroism=(r.heroism||0)+1)}
        }},
        'Start Trek':{ affected:[''],
          canStart:(input) => input.climbingGears>=1,
          effect:(r) => r.town = MTOLYMPUS},
        'Underworld':{ affected:['gold'],
          canStart:(input)=>(input.gold>=500),
          effect:(r) => (r.town = 7,r.gold-=500)},
        'Climb Mountain':{ affected:['']},
        'Mana Geyser':{ affected:['mana'],
          canStart:(input) => input.pickaxe,
          effect:(r) => {
          r.temp9 = (r.temp9 || 0) + 1;
          r.mana += r.temp9 <= towns[3].goodGeysers ? 5000 : 0;
        }},
        'Decipher Runes':{ affected:['']},
        'Chronomancy':{ affected:[''],
          effect:(r, k) => k.chronomancy += 100},
        'Looping Potion':{ affected:['herbs','lpotions'],
          canStart:(input) => (input.herbs>=400),
          effect:(r, k) => (r.herbs -= 400, r.lpotions++, k.alchemy += 100)},
        'Pyromancy':{ affected:[''],
          effect:(r, k) => k.pyromancy += 100*(1+getBuffLevel("Heroism") * 0.02)},
        'Explore Cavern':{ affected:['']},
        'Mine Soulstones':{ affected:['soul'],
          canStart:(input) => input.pickaxe,
          effect:(r) => {
          r.temp10 = (r.temp10 || 0) + 1;
          let ssGained = r.temp10 <= towns[3].goodMineSoulstones ? h.getRewardSS(0) : 0;
          r.nonDungeonSS = (r.nonDungeonSS || 0) + ssGained;
          r.soul += ssGained;
        }},
        'Hunt Trolls':{ affected:['blood'], loop: {
          cost:(p, a) => segment =>  precision3(Math.pow(2, Math.floor((p.completed + segment) / a.segments+.0000001)) * 1e6),
          tick:(p, a, s, k, r) => offset => (h.getSelfCombat(r, k) * Math.sqrt(1 + p.total/100) * (1 +  getLevelFromExp(s[a.loopStats[(p.completed + offset) % a.loopStats.length]])/100)),
          effect:{segment:(r,k) => (k.combat += 1000*(1+getBuffLevel("Heroism") * 0.02)), loop:(r, k) => (r.blood++, k.combat += 1000*(1+getBuffLevel("Heroism") * 0.02))}
        }},
        'Check Walls':{ affected:['']},
        'Take Artifacts':{ affected:['artifacts'],
          effect:(r) => {
          r.temp11 = (r.temp11 || 0) + 1;
          r.artifacts += r.temp11 <= towns[3].goodArtifacts ? 1 : 0;
        }},
        'Imbue Mind':{ affected:['mind'],
          canStart:true, loop: {
          max:() => 1,
          cost:(p) => segment => 100000000 * (segment * 5 + 1),
          tick:(p, a, s, k) => offset => {
            let attempt = Math.floor(p.completed / a.segments + .0000001);

            return attempt < 1 ? ( getSkillLevelFromExp(k.magic) * h.getStatProgress(p, a, s, offset, 100)) : 0;
          },
          effect:{loop:(r) => r.mind++}
        }},
        'Imbue Body':{ affected:['body'],
          canStart:true, loop: {
          max:() => 1,
          cost:(p) => segment => 100000000 * (segment * 5 + 1),
          tick:(p, a, s, k) => offset => {
            let attempt = Math.floor(p.completed / a.segments + .0000001);

            return attempt < 1 ? ( getSkillLevelFromExp(k.magic) * h.getStatProgress(p, a, s, offset, 100)) : 0;
          },
          effect:{loop:(r) => r.body++}
        }},
        'Face Judgement':{ affected:[''],
          effect:(r) => (r.town = r.rep>=50?4:(r.rep<=-50?5:r.town))},
        'Guru':{ affected:['herbs'],
          canStart:(input)=>(input.herbs>=1000),
          effect:(r) => (r.town = 4,r.herbs-=1000)},
        'Guided Tour':{ affected:['gold'],
          canStart:(input) => {
          return (input.gold >= 10);
        },
          effect:(r,k)=>(r.gold -= 10)},
        'Canvass':{ affected:['']},
        'Donate':{ affected:['gold','rep'],
          canStart:(input) => {
          return (input.gold >= 20);
        },
          effect:(r) => {
          r.gold -= 20;
          r.rep += 1;
        }},
        'Accept Donations':{ affected:['gold','rep'],
          canStart:(input) => {
          return (input.rep > 0);
        },
          effect:(r) => {
          r.donateLoot = (r.donateLoot || 0) + 1;
          if (r.donateLoot<=towns[4].goodDonations) {
            r.gold += 20;
          }
          r.rep -= 1;
        }},
        'Tidy Up':{ affected:['gold','rep'], loop: {
          cost:(p, a) => segment =>  fibonacci(Math.floor((p.completed + segment) - p.completed / 3 + .0000001)) * 1000000,
          tick:(p, a, s, k) => offset =>  h.getStatProgress(p, a, s, offset, 100) * Math.sqrt(1 + p.total / 100),
          effect:{loop:(r) => {
              r.gold += 5;
              r.rep += 1;
            }}
        }},
        'Buy Mana Z5':{ affected:['mana','gold'],
          canStart:true,
          effect:(r) => (r.mana += r.gold *  Action.BuyManaZ5.goldCost(), r.gold = 0)},
        'Sell Artifact':{ affected:['gold','artifacts'],
          canStart:(input) => {
          return (input.artifacts >= 1);
        },
          effect:(r) => {
          r.gold += 50;
          r.artifacts -= 1;
        }},
        'Gift Artifact':{ affected:['artifacts'],
          canStart:(input) => {
          return (input.artifacts >= 1);
        },
          effect:(r) => {
          r.artifacts -= 1;
          r.favor += 1;
        }},
        'Mercantilism':{ affected:[''],
          canStart:(input) => (input.rep > 0),
          effect:(r, k) => {
          k.mercantilism += 100;
          r.rep--;
        }},
        'Charm School':{ affected:['']},
        'Oracle':{ affected:['']},
        'Enchant Armor':{ affected:['armor','favor','enchantments'],
          canStart:(input) => {
          return (input.armor >= 0 && input.favor >= 0);
        },
          effect:(r) => {
          r.armor -= 1;
          r.favor -= 1;
          r.enchantments += 1;
        }},
        'Wizard College':{ affected:['gold','favor','wizard'],
          canStart:(input) => {
          return (input.gold >= 500 && input.favor >= 10);
        }, loop: {
          cost:(p) => segment =>  precision3(Math.pow(1.3, p.completed + segment)) * 1e7,
          tick:(p, a, s, k) => offset => ( getSkillLevelFromExp(k.magic) +
                                           getSkillLevelFromExp(k.chronomancy) +  getSkillLevelFromExp(k.pyromancy) +  getSkillLevelFromExp(k.restoration) +  getSkillLevelFromExp(k.spatiomancy)) *
                                          h.getStatProgress(p, a, s, offset, 100) * Math.sqrt(1 + p.total / 1000),
          effect:{segment:(r, k) => (r.wizard++)}
        }},
        'Restoration':{ affected:[''], manaCost:(r,k)=>(15000 / h.getWizardRankBonus(r)),
          effect:(r, k) => k.restoration += 100*(1+getBuffLevel("Heroism") * 0.02)},
        'Spatiomancy':{ affected:[''], manaCost:(r,k)=>(20000 / h.getWizardRankBonus(r)),
          effect:(r, k) => k.spatiomancy += 100},
        'Seek Citizenship':{ affected:['']},
        'Build Housing':{ affected:[''],
          canStart:(input) => {
          return (input.houses||0) < Math.floor(h.getGuildRankBonus(input.crafts || 0) * (1 + Math.min( getSkillLevelFromExp(skills.Spatiomancy.exp),500) * .01));
        },
          effect:(r) => (r.houses = (r.houses ? r.houses+1 : 1))},
        'Collect Taxes':{ affected:[''],
          canStart:(input) => (input.houses > 0),
          effect:(r, k) => {
          r.gold += Math.floor(r.houses *  getSkillLevelFromExp(k.mercantilism) / 10);
        }},
        'Pegasus':{ affected:['gold','favor'],
          canStart:(input) => {
          return (input.gold >= 200 && input.favor >= 20);
        },
          effect:(r) => {
          r.gold -= 200;
          r.favor -= 20;
          r.pegasus = true;
        }},
        'Great Feast':{ affected:['feast'],
          canStart:(input) => (input.rep >= 100), loop: {
          max:() => 1,
          cost:(p) => segment => 1000000000 * (segment * 5 + 1),
          tick:(p, a, s, k) => offset => {
            return   h.getStatProgress(p, a, s, offset, 100);
          },
          effect:{loop:(r) => r.feast++}
        }},
        'Fight Frost Giants':{ affected:[''],
          canStart:(input) => (input.pegasus), loop: {
          cost:(p, a) => segment => precision3(Math.pow(1.3, (p.completed + a.segments)) * 1e7),
          tick:(p, a, s, k, r) => offset => h.getSelfCombat(r, k) * Math.sqrt(1 + p.total / 1000) * h.getStatProgress(p, a, s, offset, 100),
          effect:{segment:(r,k) => (r.giants=(r.giants||0)+1 ,k.combat+=1250*(1+getBuffLevel("Heroism") * 0.02)), loop:(r,k) => {(k.combat += 1500*(1+getBuffLevel("Heroism") * 0.02))}}
        }},
        'Seek Blessing':{ affected:[''],
          canStart:(input) => {
          return (input.pegasus);
        },
          effect:(r, k) => {
          k.divine+= (r.giants>62? 10: precision3(1 + 0.05 * Math.pow(r.giants||0, 1.05)) ) *50;
        }},
        'Fall From Grace':{ affected:[''],
          effect:(r) => {
          if (r.rep >= 0) {
            r.rep = -1;
          }
          r.town=5;
        }},
        'Meander':{ affected:['']},
        'Mana Well':{ affected:[''],
          canStart:true,
          effect:(r,k)=> {
            r.wellLoot = (r.wellLoot || 0) + 1;
            r.mana += r.wellLoot <= towns[5].goodWells ? Math.max(5000 - Math.floor(r.totalTicks/10),0) : 0;
          }},
        'Destroy Pylons':{ affected:['pylons'],
          effect:(r) => {
          r.pylonLoot = (r.pylonLoot || 0) + 1;
          if (r.pylonLoot<=towns[5].goodPylons) {
            r.pylons += 1;
          }
        }},
        'Raise Zombie':{ affected:['blood','zombie'],
          canStart:(input) => (input.blood >= 1),
          effect:(r) => {
            r.blood -= 1;
            r.zombie += 1;
          }},
        'Dark Sacrifice':{ affected:['blood'],
          canStart:(input) => (input.blood >= 1),
          effect:(r,k) => (r.blood -=1,k.commune+=100)},
        'The Spire':{ affected:['soul'], manaCost:(r,k) => {
           return 100000 * Math.pow(0.9,r.pylons)
        },
          canStart:true, loop: {
          max:(a) =>  dungeons[a.dungeonNum].length,
          cost:(p, a) => segment =>  precision3(Math.pow(2, Math.floor((p.completed + segment) / a.segments + .0000001)) * 10000000),
          tick:(p, a, s, k, r) => offset => {
            const floor = Math.floor(p.completed / a.segments + .0000001);

            return floor in  dungeons[a.dungeonNum] ?
                h.getTeamCombat(r, k) *
                h.getStatProgress(p, a, s, offset, 100) *
                Math.sqrt(1 +  dungeons[a.dungeonNum][floor].completed / 200) : 0;
          },
          effect:{ end:(r,k) => {(k.combat += 100*(1+getBuffLevel("Heroism") * 0.02))}, loop:(r) => r.soul += h.getRewardSS(2)}
        }},
        'Purchase Supplies':{ affected:['gold'],
          canStart:(input) => (input.gold >= 500 && input.supplies === 0),
          effect:(r) => {
          r.gold -= 500;
          r.supplies = (r.supplies || 0) + 1;
        }},
        'Dead Trial':{ affected:['zombie'],
          canStart:true, loop: {
          max:(a) => trialFloors[a.trialNum],
          cost:(p, a) => segment => precision3(Math.pow(a.floorScaling, Math.floor((p.completed + segment) / a.segments + .0000001)) * a.baseScaling),
          tick:(p, a, s, k, r) => offset => {
            const floor = Math.floor(p.completed / a.segments + .0000001);
            return floor in trials[a.trialNum] ? h.getZombieStrength(r, k) * h.getStatProgress(p, a, s, offset, 100) * Math.sqrt(1 + trials[a.trialNum][floor].completed / 200) : 0;
          },
          effect:{loop:(r) => (r.zombie++)}
        }},
        'Journey Forth':{ affected:[''],
          canStart:(input) => (input.supplies >= 1),
          effect:(r) => {
            r.supplies--;
            r.town=6;
        }},
        'Explore Jungle':{ affected:['herbs'],
          effect:(r) => (r.herbs++)},
        'Fight Jungle Monsters':{ affected:['hide'],
          canStart:true, loop: {
          cost:(p, a) => segment =>  precision3(Math.pow(1.3, p.completed + segment)) * 1e8,
          tick:(p, a, s, k, r) => offset => h.getSelfCombat(r, k) * h.getStatProgress(p, a, s, offset, 100) *
                                             Math.sqrt(1 + p.total / 1000),
          effect:{segment:(r) => r.hide=(r.hide||0)+1, loop:(r,k)=> (k.combat+=2000*(1+getBuffLevel("Heroism") * 0.02))}
        }},
        'Rescue Survivors':{ affected:[''],
          canStart:true, loop: {
          cost:(p, a) => segment =>  fibonacci(2 + Math.floor((p.completed + segment) / a.segments + .0000001)) * 5000,
          tick:(p, a, s, k) => offset =>  getSkillLevelFromExp(k.magic) * Math.max( getSkillLevelFromExp(k.restoration) / 100, 1) * h.getStatProgress(p, a, s, offset, 100) * Math.sqrt(1 + p.total / 100),
          effect:{ end:(r,k) => { (k.restoration += 25*(1+getBuffLevel("Heroism") * 0.02))}, loop:(r) => (r.survivor= (r.survivor||0)+1,r.rep+=4)}
        }},
        'Prepare Buffet':{ affected:['herbs','hide'],
          canStart:(input) => ((input.herbs>=10) && (input.hide>=1)),
          effect:(r,k) => {
            r.hide-=10;
            r.blood--;
            k.gluttony+=5*r.survivor;
          }},
        'Totem':{ affected:['lpotions'],
          canStart:(input)=>(input.lpotions>0),
          effect:(r,k)=>(r.lpotions--,k.wunderkind+=100)},
        'Escape':{ affected:[''],
          canStart:(input) => (input.totalTicks<=100*60),
          effect:(r) => (r.town=7)},
        'Open Portal':{ affected:[''],
          effect:(r,k) => (r.town=1,k.restoration+=2500*(1+getBuffLevel("Heroism") * 0.02))},
        'Excursion':{ affected:['gold'],
          canStart:(input) => {
          return input.gold>=(((input.guild==='thieves')) >= 0 ? 2 : 10);
        },
          effect:(r, k) => {
          r.gold -= (((r.guild==='thieves')) ? 2 : 10);
        }},
        'Explorers Guild':{ affected:['map','completedMap'],
          canStart:(input) => (input.guild==''),
          effect:(r,k) => {
          r.submittedMap=r.completedMap;
          r.completedMap=0;
          r.guild='explorer';
          if (r.map==0) {
            r.map=30;
          }
        }},
        'Thieves Guild':{ affected:['gold','thieves'],
          canStart:(input) => {
          return ((input.rep < 0) && (input.guild==''));
        }, loop: {
          cost:(p) => segment =>  precision3(Math.pow(1.2, p.completed + segment)) * 5e8,
          tick:(p, a, s, k, r) => offset => (getSkillLevelFromExp(k.thievery)) * h.getStatProgress(p, a, s, offset, 100) * Math.sqrt(1 + p.total / 1000),
          effect:{ end:(r, k) => (r.guild='thieves',k.thievery+=50), segment:(r,k) => (r.gold += 10, r.thieves=( r.thieves||0)+1,k.practical+=50,k.thievery+=50)}
        }},
        'Pick Pockets':{ affected:[''],
          canStart:(input) => (input.guild==='thieves'),
          effect:(r, k) => {
          r.gold += Math.floor(Math.floor(1 * h.getSkillBonusInc(k.thievery)) * h.getGuildRankBonus(r.thieves));
          k.thievery+=10 * (1 + towns[COMMERCEVILLE].getLevel("PickPockets") / 100);
        }},
        'Rob Warehouse':{ affected:[''],
          canStart:(input) => (input.guild==='thieves'),
          effect:(r, k) => {
          r.gold += Math.floor(Math.floor(10 * h.getSkillBonusInc(k.thievery)) * h.getGuildRankBonus(r.thieves));
          k.thievery+=20 * (1 + towns[COMMERCEVILLE].getLevel("RobWarehouse") / 100);
        }},
        'Insurance Fraud':{ affected:[''],
          canStart:(input) => (input.guild==='thieves'),
          effect:(r, k) => {
          r.gold += Math.floor(Math.floor(100 * h.getSkillBonusInc(k.thievery)) * h.getGuildRankBonus(r.thieves));
          k.thievery+=40 * (1 + towns[COMMERCEVILLE].getLevel("InsuranceFraud") / 100);
        }},
        'Invest':{ affected:['gold'],
          canStart:(input)=>(input.gold>0),
          effect:(r,k)=> {
           k.mercantilism+=100;
           r.gold=0;
        }},
        'Collect Interest':{ affected:['gold'],
          canStart:true,
          effect:(r,k)=> {
           k.mercantilism+=50;
           r.gold+=Math.floor(goldInvested * .001);
        }},
        'Purchase Key':{ affected:['gold'],
          canStart:(input)=>(input.gold>=1000000),
          effect:(r,k)=> {
           r.gold-=1000000;
           r.key=1;
        }},
        'Secret Trial':{ affected:['zombie'],
          canStart:true, loop: {
          max:(a) => trialFloors[a.trialNum],
          cost:(p, a) => segment => precision3(Math.pow(a.floorScaling, Math.floor((p.completed + segment) / a.segments + .0000001)) * a.baseScaling),
          tick:(p, a, s, k, r) => offset => {
            const floor = Math.floor(p.completed / a.segments + .0000001);
            if (!p.progress) p.teamCombat = h.getTeamCombat(r, k);
            return floor in trials[a.trialNum] ?  p.teamCombat * h.getStatProgress(p, a, s, offset, 100) * Math.sqrt(1 + trials[a.trialNum][floor].completed / 200) : 0;
          },
          effect:{}
        }},
        'Leave City':{ affected:[''],
          canStart:(input)=>(input.key>0),
          effect:(r,k)=> {
           r.key=0;
           r.town=8;
        }},
        'Imbue Soul':{ affected:['body'],
          canStart:true, loop: {
          max:() => 1,
          cost:(p) => segment => 100000000 * (segment * 5 + 1),
          tick:(p, a, s, k) => offset => {
            let attempt = Math.floor(p.completed / a.segments + .0000001);

            return attempt < 1 ? ( getSkillLevelFromExp(k.magic) * h.getStatProgress(p, a, s, offset, 100)) : 0;
          },
          effect:{loop:(r) => r.body++}
        }},
        'Build Tower':{ affected:['stone'],
          canStart:(input)=>((input.stone||0)==1),
          effect:(r,k)=>(r.stone=0)},
        'Gods Trial':{ affected:['power'],
          canStart:true, loop: {
          max:(a) => trialFloors[a.trialNum],
          cost:(p, a) => segment => precision3(Math.pow(a.floorScaling, Math.floor((p.completed + segment) / a.segments + .0000001)) * a.baseScaling),
          tick:(p, a, s, k, r) => offset => {
            const floor = Math.floor(p.completed / a.segments + .0000001);
            return floor in trials[a.trialNum] ? h.getTeamCombat(r, k) * h.getStatProgress(p, a, s, offset, 100) * Math.sqrt(1 + trials[a.trialNum][floor].completed / 200) : 0;
          },
          effect:{ end:(r,k) => (k.combat+=250*(1+getBuffLevel("Heroism") * 0.02),k.pyromancy+=50*(1+getBuffLevel("Heroism") * 0.02),k.restoration+=50*(1+getBuffLevel("Heroism") * 0.02)), loop:(r) => {
            r.godFloor=(r.godFloor||0)+1;
            if (r.godFloor>=100) {
              r.power=1;
            }
          }}
        }},
        'Challenge Gods':{ affected:['power'],
          canStart:(input)=>(input.power>0), loop: {
          max:(a) => trialFloors[a.trialNum],
          cost:(p, a) => segment => precision3(Math.pow(a.floorScaling, Math.floor((p.completed + segment) / a.segments + .0000001)) * a.baseScaling ),
          tick:(p, a, s, k, r) => offset => {
            const floor = Math.floor(p.completed / a.segments + .0000001);
            return floor in trials[a.trialNum] ? h.getSelfCombat(r, k) * h.getStatProgress(p, a, s, offset, 100) * Math.sqrt(1 + trials[a.trialNum][floor].completed / 200) : 0;
          },
          effect:{ end:(r,k) => (k.combat+=500*(1+getBuffLevel("Heroism") * 0.02)), loop:(r) => (r.power++)}
        }},
        'Restore Time':{ affected:['power','rep'],
          canStart:(input)=>(input.power>=8),
          effect:(r)=> (r.rep+=9999999)},
        'First Trial':{ affected:['']},
        'Break Loop':{ affected:['loopPotion'],
          canStart:(input) => {
          return input.loopPotion
        }},

        //SPECIAL ACTIONS
        //Survey Actions
        'SurveyZ0': surveyBase,
        'SurveyZ1': surveyBase,
        'SurveyZ2': surveyBase,
        'SurveyZ3': surveyBase,
        'SurveyZ4': surveyBase,
        'SurveyZ5': surveyBase,
        'SurveyZ6': surveyBase,
        'SurveyZ7': surveyBase,
        'SurveyZ8': surveyBase,

/*        //assasin Actions;
        'AssassinZ0': assassinBase,
        'AssassinZ1': assassinBase,
        'AssassinZ2': assassinBase,
        'AssassinZ3': assassinBase,
        'AssassinZ4': assassinBase,
        'AssassinZ5': assassinBase,
        'AssassinZ6': assassinBase,
        'AssassinZ7': assassinBase,
*/
// END OF ACTIONS*/
      };

      /**
       * Prediction collection
       * @member {Object.<string, Prediction>}
       */
      this.predictions = {};

      // Create predictions
      for (const name in predictions) {
        this.predictions[name] = new Koviko.Prediction(name, predictions[name]);
        if (name=="Secret Trial") {
          this.predictions["Secret Trial"]._updateTicks=this.predictions[name].updateTicks;
          this.predictions["Secret Trial"].updateTicks= (a, s, state) => {
            if (!state.currProgress["Secret Trial"]) {
              return this.predictions["Secret Trial"]._updateTicks(a, s, state);
            }
            return this._ticks;
          }
        }
      }
    }

    /**
     * Fires before the main action list update, stores the current list to reduce flickering while updating.
     * @param {HTMLElement} [container] Parent element of the action list
     */
    preUpdate(container) {
      this.update.totalDisplay = this.totalDisplay.innerHTML;
      this.updateTrackedList();
      this.update.pre = container.querySelectorAll('ul.koviko');
      this.update.pre.forEach((element) => element.classList.add('expired'));
    }

    /**
     * Update the action list view.
     * @param {Array.<IdleLoops~ListedAction>} actions Actions in the action list
     * @param {HTMLElement} [container] Parent element of the action list
     * @param {boolean} [isDebug] Whether to log useful debug information
     * @memberof Koviko.Predictor
     */
    async update(actions, container, isDebug) {

      if ((this.update.pre?.length)&&!isDebug) {
        Array.from(container.children).map((element, i) => {
          if(i < this.update.pre.length){
            element.appendChild(this.update.pre[i]);
          }
        });
      }

      /**
       * Organize accumulated resources, accumulated stats, and accumulated progress into a single object
       * @var {Koviko.Predictor~State}
       */
      let state;

      //"Slowmode means only update the initial state every X Minutes
      if(Koviko.options.slowMode) {
        if (this.initState && (new Date()<this.nextUpdate)) {
          state=structuredClone(this.initState);
          //console.log("Slowmode - Redraw");
        } else {
          this.nextUpdate=new Date(Date.now()+ Koviko.options.slowTimer*1000*60);
          //console.log("Slowmode - Update Data");
        }
      }

      if (!state) {
        state = {
          resources: { mana: (500+50*getBuffLevel("ImbueSoulstones")), town: 0, guild: "",rep:0, total:0, totalTicks:0,  squirrel:0, deadSquirrel:0},
          stats: Koviko.globals.statList.reduce((stats, name) => (stats[name] = getExpOfLevel(buffs.Imbuement2.amt*(Koviko.globals.skills.Wunderkind.exp>=100?2:1)), stats), {}),
          talents:  Koviko.globals.statList.reduce((talents, name) => (talents[name] = stats[name].talent, talents), {}),
          skills: Object.assign(Object.entries(skills).reduce((skills, x) => (skills[x[0].toLowerCase()] = x[1].exp, skills), {}),Object.entries(skillsSquirrel).reduce((skills, x) => (skills[x[0].toLowerCase()+"_squirrel"] = x[1].exp, skills), {})),
          progress: {},
          currProgress: {}
        };
        if (Koviko.options.slowMode) {
          this.initState=structuredClone(state);
        }
      }
      //Once you Surveyed everything you get free Glasses [Found Glasses]
      if(getExploreProgress() >= 100) {
        state.resources.glasses=true;
      }
      if(getLevelSquirrelAction("Pet Squirrel") >= 2) state.resources.squirrel=1;


      //Challenge Mode
        if ((typeof challengeSave!="undefined")&&(challengeSave.challengeMode==1)) {
          state.resources.isManaDrought=true;
          state.resources.manaBought=7500;
        }


      /**
       * Snapshots of accumulated stats and accumulated skills
       * @var {Object}
       * @prop {Koviko.Snapshot} stats Snapshot of accumulated stats
       * @prop {Koviko.Snapshot} skills Snapshot of accumulated skills
       */
      const snapshots = {
        stats: new Koviko.Snapshot(state.stats),
        skills: new Koviko.Snapshot(state.skills),
        currProgress: new Koviko.Snapshot({"Fight Monsters": 0, "Heal The Sick": 0, "Small Dungeon": 0, "Large Dungeon": 0, "Hunt Trolls": 0, "Tidy Up":0,"Fight Frost Giants":0, "The Spire":0, "Fight Jungle Monsters":0,"Rescue Survivors":0,"Heroes Trial":0,
          "Dead Trial":0, "Secret Trial":0, "Gods Trial":0, "Challenge Gods":0, "Magic Fighter":0, "Training Dummy":0,"Mock Battle":0})
      };

      /**
       * All affected resources of the current action list
       * @var {Array.<string>}
       */
      const affected = Object.keys(actions.reduce((stats, x) => (x.name in this.predictions && this.predictions[x.name].affected || []).reduce((stats, name) => (stats[name] = true, stats), stats), {}));

      // Reset the cache's index
      // returns false on cache miss
      let cache = this.cache.reset([state, affected]);


      //Statistik parammeters
      let statisticStart=0;
      switch(Koviko.options.trackedStat[0]) {
        case 'R':
          break;
        case 'S':
        case 'Q':
          statisticStart=state.skills[Koviko.options.trackedStat[1].toLowerCase()];
          break;
        case 'T':
          statisticStart=state.talents[Koviko.options.trackedStat[1]];
          break;
      }

      // Initialize all affected resources
      affected.forEach(x => state.resources[x] || (state.resources[x] = 0));

      // Initialize the display element for the total amount of mana used
      if(container){
        this.totalDisplay.innerHTML = this.update.totalDisplay;
        this.totalDisplay.parentElement.classList.add('expired');
      }

      // Initialize cached variables outside of the loop so we don't have to worry about initializing them on hit/miss in two separate places
      /** @var {boolean} */
      let isValid;
      let loop;

      // If id != update.id, then another update was triggered and we need to stop processing this one
      let id = {};
      this.update.id = id;

      let finalIndex=actions.length-1;
      while ((finalIndex>0) && (actions[finalIndex].disabled)) {
        finalIndex--;
      }
      // Run through the action list and update the view for each action
      for(const [i, listedAction] of actions.entries()) {

        // If the cache hit the last time
        if(cache && i !== finalIndex) {
          // Pull out all the variables we would usually expensivly calculate
          cache = this.cache.next([listedAction.name, listedAction.squirrelAction, listedAction.loops, listedAction.disabled]);
          if(cache) {
            [state, isValid] = cache

          }
        }

        /** @var {Koviko.Prediction} */
        let prediction = this.predictions[listedAction.name];

        if (prediction) {
          /**
           * Element for the action in the list
           * @var {HTMLElement}
           */
          let div = container ? container.children[i] : null;

          let repeatLoop = Koviko.options.repeatPrediction && options.repeatLastAction && (i == finalIndex) && (prediction.action.allowed==undefined);

          if(!cache || i == finalIndex) {
            // Reinitialise variables on cache miss
            isValid = (prediction.action.townNum==state.resources.town);

            /** @var {number} */
            let currentMana;

            // Make sure that the loop is properly represented in \`state.progress\`
            if (prediction.loop && !(prediction.name in state.progress)) {
              /** @var {Koviko.Predictor~Progression} */
              state.progress[prediction.name] = {
                progress: 0,
                completed: 0,
                total: Koviko.globals.towns[prediction.action.townNum]['total' + prediction.action.varName],
              };
            }

            state.resources.actionTicks=0;

            // Complicated mess of ifs to use the cache for 90% of the last action

            if(i == finalIndex && cache){
              let key = [listedAction.name, listedAction.squirrelAction, listedAction.disabled];
              key['last'] = true;
              let lastcache = this.cache.next(key);

              if(lastcache && lastcache[1] < listedAction.loops){
                [state, loop, isValid] = lastcache;

                // Invalidate the entry if it's from less than 90% through (it'll be set again once it gets to 90%)
                if(loop <= Math.floor(listedAction.loops * 0.9)){
                  this.cache.miss(true);
                }
              } else {
                loop = 0;
                this.cache.miss(true);
              }
            } else {
              loop = 0;
            }

            // Predict each loop in sequence
            for (loop; repeatLoop ? isValid : loop < listedAction.loops; loop++) {
              let canStart = typeof(prediction.canStart) === "function" ? prediction.canStart(state.resources, listedAction.squirrelAction) : prediction.canStart;
              if (!canStart) { isValid = false; }
              if ( !canStart || listedAction.disabled ) { break; }
              if (listedAction.squirrelAction&&(state.resources.squirrel<=0)) {isValid = false;}

              // Save the mana prior to the prediction
              currentMana = state.resources.mana;

              // Special case for the Squirrel sanctuary (no exp, massive speed boost)
              if (state.resources.town==SANCTUARY) {
                const multiTick=Math.pow(4, getBuffLevel("SpiritBlessing"));
                const ticks=Math.ceil(prediction.updateTicks(prediction.action, state.stats, state, listedAction.squirrelAction)/multiTick);
                const actionDuration=ticks/this.getSpeedMult(state.resources,state.skills);
                state.resources.totalTicks += actionDuration;
                state.resources.actionTicks+= actionDuration;
                state.resources.mana-=ticks*multiTick;
                if (state.resources.mana<0 && state.resources.mana>(-multiTick)) {
                  state.resources.mana=0; //Special case so a single action is alway completable
                }

              // Skip EXP calculations for the last element, when no longer necessary (only costs 1 mana)
              } else if ((i==finalIndex) && (prediction.ticks()==1) &&(!prediction.loop) &&(loop>0)) {
                state.resources.mana--;
                const tickDuration=1/this.getSpeedMult(state.resources,state.skills);
                state.resources.totalTicks += tickDuration;
                state.resources.actionTicks+= tickDuration;
                state.resources.total++;

                //Special case for loops that are already at maximum progress
              } else if (prediction.loop && prediction.loop.max &&((prediction.loop.max(prediction.action)*prediction.action.segments)<=state.progress[prediction.name].completed)) {
                break;
              } else {
                // Run the prediction
                this.predict(prediction, state, listedAction.squirrelAction);
              }

              // Check if the amount of mana used was too much
              isValid = isValid && state.resources.mana >= 0;

              if (repeatLoop&& !isValid) {break;}

              // Run the effect, now that the mana checks are complete
              if (prediction.effect) {
                prediction.effect(state.resources, state.skills, listedAction.squirrelAction);
              }
              if (prediction.loop) {
                if (prediction.loop.effect.end) {
                  prediction.loop.effect.end(state.resources, state.skills, listedAction.squirrelAction);
                }
              }

              // Add to cache 90% through the final action
              if(i==finalIndex && loop === Math.floor(listedAction.loops * 0.9)){
                let key = [listedAction.name, listedAction.squirrelAction, listedAction.disabled];
                key['last'] = true;
                this.cache.add(key, [state, loop + 1, isValid]);
              }

              // Sleep every 100ms to avoid hanging the game
              if(Date.now() % 100 === 0){
                await new Promise(r => setTimeout(r, 1));

                // If id != update.id, then another update was triggered and we need to stop processing this one
                if(id != this.update.id) {
                  return;
                }
              } 

            }

            if (repeatLoop&& loop>=listedAction.loops) {
              isValid=true;
            }
  

            if(prediction.name in state.progress)
              state.currProgress[prediction.name] = state.progress[prediction.name].completed / prediction.action.segments;
            // Update the cache
            if(i!==finalIndex) this.cache.add([listedAction.name, listedAction.squirrelAction, listedAction.loops, listedAction.disabled], [state, isValid]);
          }
          // Update the snapshots
          for (let i in snapshots) {
            snapshots[i].snap(state[i]);
          }

          // Update the view
          if (div) {
            div.querySelector('.expired')?.remove();
            if (typeof(repeatLoop) !== 'undefined' && repeatLoop) {
              affected.unshift('finLoops');
              state.resources.finLoops=loop;
            }
            div.className += ' showthat';
            div.innerHTML += this.template(listedAction.name, affected, state.resources, snapshots, isValid);
          }
        }
      }

      if (!cache) {
        this.initState=false;
      }
      // Update the display for the total amount of mana/time used by the action list
      let total = state.resources.total;
      let totalTicks = state.resources.totalTicks;
      totalTicks /= 100;

      var h = Math.floor(totalTicks / 3600);
      var m = Math.floor(totalTicks % 3600 / 60);
      var s = Math.floor(totalTicks % 3600 % 60);
      var ms = Math.floor(totalTicks % 1 * Math.pow(10,Koviko.options.timePrecision));
      while(ms.toString().length < Koviko.options.timePrecision) { ms = "0" + ms; }

      let totalTime = ('0' + h).slice(-2) + ":" + ('0' + m).slice(-2) + ":" + ('0' + s).slice(-2) + "." + ms;

      let newStatisticValue=0;
      let legend="";

      switch(Koviko.options.trackedStat[0]) {
        case 'R':
          if (Koviko.options.trackedStat[1]=="soul") {
            let dungeonEquilibrium = Math.min(Math.sqrt(total / 200000),1);
            let dungeonSS = state.resources.soul - (state.resources.nonDungeonSS || 0);
            newStatisticValue = ((state.resources.nonDungeonSS || 0) + dungeonEquilibrium * (dungeonSS || 0)) / totalTicks * 60;
            legend="SS";
          } else if (Koviko.options.trackedStat[1]=="act") {
            newStatisticValue= loop / totalTicks * 60;
            legend=finalIndex>=0?actions[finalIndex].name:"---";
          } else if (Koviko.options.trackedStat[1]=="survey") {
            newStatisticValue= getExploreSkill()* (state.resources.completedMap+3*state.resources.submittedMap)  / totalTicks * 60;
            legend="Survey";
          }
          break;
        case 'S':
        case 'Q':
          newStatisticValue=(state.skills[Koviko.options.trackedStat[1].toLowerCase()]-statisticStart)/ totalTicks * 60;
          legend=this.getShortSkill(Koviko.options.trackedStat[1].toLowerCase());
          break;
        case 'T':
          newStatisticValue=(state.talents[Koviko.options.trackedStat[1]]-statisticStart)/ totalTicks * 60;
          legend=_txt('stats>'+Koviko.options.trackedStat[1]+'>short_form');
          break;
      }


      container && (this.totalDisplay.innerHTML = intToString(total) + " | " + totalTime + " | " );
      container && (this.statisticDisplay.innerHTML = intToString(newStatisticValue||0) +" "+legend+ "/min");
      if (this.resourcePerMinute>newStatisticValue) {
        this.statisticDisplay.style='color: #FF0000';
      } else {
        this.statisticDisplay.style='color: #8293ff'
      }
     this.resourcePerMinute=newStatisticValue;

     this.totalDisplay.parentElement.classList.remove('expired');

      // Log useful debugging data
      if (isDebug) {
        console.info({
          actions: actions,
          affected: affected,
          state: state,
          total: total
        });
      }
      this.state = state;

      // Fire an event when a prediction finishes for other scripts to hook into
      document.dispatchEvent(new Event('predictor-update'));
    }

    getSpeedMult(r, k) {
      let speedMult = 1;

      // Yin and Yang
      let bonusYin = Math.min(100, getSkillLevelFromExp(k.yin) * 0.5);
      const capYinReputation = Math.max(getBuffLevel("YinYang"), r.rep * (-1)) * 2;
      bonusYin = Math.min(capYinReputation, bonusYin);

      let bonusYang = Math.min(100, getSkillLevelFromExp(k.yang) * 0.5);
      const capYangReputation = Math.max(getBuffLevel("YinYang"), r.rep) * 2;
      bonusYang = Math.min(capYangReputation, bonusYang);

	  speedMult *= (1 + bonusYin/100) * (1 + bonusYang/100);

      // chronomancy
      speedMult *= Math.pow(1 + getSkillLevelFromExp(k.chronomancy) / 60, 0.25);

      //Imbue Soul
      speedMult += 0.5 * getBuffLevel("Imbuement3");

      return speedMult;

    }

    getShortSkill(name) {
      switch(name.toLowerCase()) {
        case "chronomancy":
          return 'CHRO';
        case "crafting":
          return 'CRAFT';
        case "pyromancy":
          return 'PYRO';
        case "alchemy":
          return 'ALCH';
        case "combat":
          return 'COMB';
        case "practical":
          return 'PRACT';
        case "restoration":
          return 'RESTO';
        case "spatiomancy":
          return 'SPACE';
        case "mercantilism":
          return 'MERC';
        case "divine":
          return 'DIVI';
        case "commune":
          return 'COMU';
        case "wunderkind":
          return 'WUKID';
        case "gluttony":
          return 'GLUTT';
        case "thievery":
          return 'THIEF';
        case "teamwork":
          return 'TWork';
        case "assassin":
          return 'ASSA';
        case "trust_squirrel":
          return 'TRUST';
        case "combat_squirrel":
          return 'SCOMB';
        case "magic_squirrel":
          return 'SMAGE';
        default:
          return name.toUpperCase().substring(0,5);
      }
    }

    /**
     * Generate the element showing the resources accumulated for an action in the action list.
     * @param {Array.<string>} affected Names of resources to display
     * @param {string} currname Name of the snapshot on hoverover
     * @param {Koviko.Predictor~Resources} resources Accumulated resources
     * @param {Object} snapshots Snapshots with value comparisons
     * @param {Koviko.Snapshot} snapshots.stats Value comparisons of stats from one snapshot to the next
     * @param {Koviko.Snapshot} snapshots.skills Value comparisons of skills from one snapshot to the next
     * @param {boolean} isValid Whether the amount of mana remaining is valid for this action
     * @return {string} HTML of the new element
     * @memberof Koviko.Predictor
     */
    template(currname, affected, resources, snapshots, isValid) {
      isValid = isValid ? 'valid' : 'invalid';
      let stats = snapshots.stats.get();
      let skills = snapshots.skills.get();
      let currProgress = snapshots.currProgress.get();
      let tooltip = '<tr><th colspan="3"><b>' + currname + '</b></th><tr>';

      for (let i in stats) {
        if (stats[i].delta) {
          let level = {
            start: Koviko.globals.getLevelFromExp(stats[i].value - stats[i].delta),
            end: Koviko.globals.getLevelFromExp(stats[i].value),
          };

          tooltip += '<tr><td><b>' + _txt(\`stats>\${i}>short_form\`).toUpperCase() + '</b></td><td>' + intToString(level.end, 1) + '</td><td>(+' + intToString(level.end - level.start, 1) + ')</td></tr>';
        }
      }

      for (let i in skills) {
        if (skills[i].delta) {
          let level = {
            start: Koviko.globals.getSkillLevelFromExp(skills[i].value - skills[i].delta),
            end: Koviko.globals.getSkillLevelFromExp(skills[i].value),
          };

          tooltip += '<tr><td><b>'
          tooltip+=this.getShortSkill(i);
          if (level.end>level.start) {
            tooltip += '</b></td><td>' + intToString(level.end, 1) + '</td><td>(+' + intToString(level.end - level.start, 1) + ')</td></tr>';
          } else {
            tooltip += '<td>' +Math.floor(skills[i].delta/(level.end+1)*1000)/1000 +'%</td><td><' + intToString(skills[i].delta, 1) + ' XP></td></tr>';
          }
        }
      }

      for (let i in currProgress) {
        if (currProgress[i].delta) {
          let level = {
            start: currProgress[i].value - currProgress[i].delta,
            end: currProgress[i].value,
          };

          tooltip += '<tr><td><b>'
          switch(i) {
            case "Fight Monsters":
              tooltip += 'MON';
              break;
            case "Heal The Sick":
              tooltip += 'PT';
              break;
            case "Small Dungeon":
              tooltip += 'SD';
              break;
            case "Large Dungeon":
              tooltip += 'LD';
              break;
            case "Hunt Trolls":
              tooltip += 'TROL';
              break;
            case "Tidy Up":
              tooltip += 'TIDY';
              break;
            case "Fight Frost Giants":
              tooltip += 'FROST';
              break;
            case "The Spire":
              tooltip += 'SPIRE';
              break;
            case "Fight Jungle Monsters":
              tooltip += 'J MON';
              break;
            case "Rescue Survivors":
              tooltip += 'SURV';
              break;
            case "Secret Trial":
              tooltip += 'SECRET';
              break;
            case "Heroes Trial":
              tooltip += 'HERO';
              break;
            case "Dead Trial":
              tooltip += 'DEAD';
              break;
            case "Gods Trial":
              tooltip += 'GODS';
              break;
            case "Challenge Gods":
              tooltip += 'CHAL';
              break;
            case "Magic Fighter":
              tooltip += "M FI";
              break;
            case "Training Dummy":
              tooltip += "Dummy";
              break;
            case "Mock Battle":
              tooltip += "MOCK";
              break;
            default:
              tooltip += i.toUpperCase();
          }
          tooltip += '</b></td><td>' + intToString(level.end, 1) + '</td><td>(+' + intToString(level.end - level.start, 1) + ')</td></tr>';
        }
      }
      //Timer
      tooltip+= '<tr><td><b>TIME</b></td><td>' + precision3(resources.totalTicks/100, 1) + '</td><td>(+' + precision3(resources.actionTicks/100, 1) + ')</td></tr>';

      var Affec = affected.map(name => {
        if ( resources[name] != 0 ) return ('<li class='+name+' title='+name.charAt(0).toUpperCase() + name.slice(1)+'>'+resources[name].toLocaleString('en', {useGrouping:true})+'</li>');
        else return "";
      }).join('');
      return \`<ul class='koviko \${isValid}'>\` + Affec + \`</ul><div class='koviko showthis'><table>\${tooltip || '<b>N/A</b>'}</table></div>\`;
    };

    /**
     * Perform one tick of a prediction.
     * @param {Koviko.Prediction} prediction Prediction object
     * @param {Koviko.Predictor~State} state State object
     * @return {boolean} Whether another tick can occur
     * @memberof Koviko.Predictor
     */
    tick(prediction, state, isSquirrel) {
      // Apply the accumulated stat experience, not for 0 Exp actions (Secret Trial & Restore Time)
      if (prediction.action.expMult!=0) prediction.exp(prediction.action, state.stats,state.talents);

      // Handle the loop if it exists
      if (prediction.loop) {

        const tickDuration=1/this.getSpeedMult(state.resources,state.skills)
        state.resources.totalTicks += tickDuration;
        state.resources.actionTicks+= tickDuration;
        state.resources.total++;

        /** @var {Koviko.Predictor~Progression} */
        const progression = state.progress[prediction.name];

        /** @var {function} */
        const loopCost = prediction.loop.cost(progression, prediction.action);

        /** @var {function} */
        const tickProgress = prediction.loop.tick(progression, prediction.action, state.stats, state.skills, state.resources, isSquirrel, loopCost);

        /** @var {number} */
        const totalSegments = prediction.action.segments;

        /** @var {number} */
        const maxSegments = prediction.loop.max ? prediction.loop.max(prediction.action) * totalSegments : Infinity;

        // Helper for caching cost Calculations
        if (!progression.costList) {
          progression.costList=[];
          for (let i=0; i<totalSegments ; i++ ) {
            progression.costList[i]=loopCost(i);
          }
        }
        /**
         * Current segment within the loop
         * @var {number}
         */
        let segment = 0;

        /**
         * Progress through the current loop
         * @var {number}
         */
        let progress = progression.progress;

        // Calculate the progress and current segment before the tick
        for (; progress >= progression.costList[segment]; progress -= progression.costList[segment++]);

        /**
         * Progress of the tick
         * @var {number}
         */
        let additionalProgress = tickProgress(segment) * (prediction.baseManaCost(prediction.action) / prediction.ticks());

        // Accumulate the progress from the tick
        progress += additionalProgress;
        progression.progress += additionalProgress;

        // Calculate the progress and current segment after the tick
        while (progress >= progression.costList[segment] && progression.completed < maxSegments) {
          progress -= progression.costList[segment++];
          // Handle the completion of a loop
          if (segment >= totalSegments) {
            progression.progress = 0;
            progression.completed += totalSegments;
            progression.total++;
            segment -= totalSegments;

            // Apply the effect from the completion of a loop
            if (prediction.loop.effect.loop) {
              prediction.loop.effect.loop(state.resources, state.skills, isSquirrel);
            }

            // Store remaining progress in next loop if next loop is allowed
            if (progression.completed < maxSegments) {
              progression.progress = progress;
              //Helper for  caching cost Calculations
              for (let i=0;i<totalSegments;i++) {
                progression.costList[i]=loopCost(i);
              }
            }
          }

          // Apply the effect from the completion of a segment
          if (prediction.loop.effect.segment) {
            prediction.loop.effect.segment(state.resources, state.skills, isSquirrel);
          }
        }

        return additionalProgress && segment < maxSegments;
      }

      return true;
    }

    /**
     * Perform all ticks of a prediction
     * @param {Koviko.Prediction} prediction Prediction object
     * @param {Koviko.Predictor~state} state State object
     * @memberof Koviko.Predictor
     */
    predict(prediction, state, isSquirrel) {
      // Update the amount of ticks necessary to complete the action, but only once at the start of the action
      prediction.updateTicks(prediction.action, state.stats, state, isSquirrel);

      //update statistic parameters, only if not in a looping action
      if (!prediction.loop) {
        const actionDuration=prediction.ticks()/this.getSpeedMult(state.resources,state.skills);
        state.resources.totalTicks += actionDuration;
        state.resources.actionTicks+= actionDuration;
        state.resources.total+=prediction.ticks();
      }

      // Perform all ticks in succession
      for (let ticks = 0; ticks < prediction.ticks(); ticks++) {
        state.resources.mana--;
        if (state.resources.mana >= 0) {
            if (!this.tick(prediction, state, isSquirrel)) break;
        }
      }
    }
  },

  hasRan: false,
  run: () => {
    if (!Koviko.hasRan) {
      Koviko.hasRan = true;
      for (let varName in Koviko.globals) {
        try {
          Koviko.globals[varName] = eval(varName);
        } catch (e) {
          console.error(\`Unable to retrieve global '\${varName}'.\`);
          Koviko.hasRan = false;
          return;
        }
      }

      window.Koviko = new Koviko.Predictor(Koviko.globals.view, Koviko.globals.actions, Koviko.globals.nextActionsDiv);
    }
  }
};

// Run the code!
//window.addEventListener('load', Koviko.run);
setTimeout(() => document.readyState == 'complete' && Koviko.run(), 2000); // If it hasn't already ran in a couple of seconds, see if it can run
`);
