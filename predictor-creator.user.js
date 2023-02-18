// ==UserScript==
// @name     Squirrel Predictor Creator
// @version  1.3.1
// @description Author script for the predictor. To use: 1.call crUpdatePredictions in the console 2. copy the result into the script, replacing everything between the "CACHE File" markers 3. Fix any TODOs in the copied cache, those are actions that changed and (maybe) need attention, if a function shouldn't be in the output replace it with '' (or\`\`) 4. call crOutputPredictions 5. paste the output into the main script, replacing the content of the "predictions" object EXEPT those after "SPECIAL ACTIONS" those are special cases that should be done by hand  // @match https://lloyd-delacroix.github.io/omsi-loops/
// @author Tomnar <Tomnar#4672 on discord>
// @match https://mopatissier.github.io/IdleLoopsReworked/
// @grant    none
// ==/UserScript==

window.eval(`   

window.creatorCache={}

function crStripFunction(func) {
	if (!func) return "";
	                    //remove Spaces         //Replace \` with '  Replace $ with @
	func= func.toString().replace(/( |\\t)*/g,"").replace(/\`/g,"'").replace(/\\\$/g,"@");
	        //remove calls to 'finishProgress' 'unlockStory' and 'view.requestUpdate'
	func=func.replace(/towns\[[0-9]*\].finishProgress\(.*\);/g,"").replace(/unlockStory\(.*\);/g,"").replace(/view.requestUpdate\(.*\);/g,"");
	          //remove All comments     //remove newLines    remove base function boilerplate code
	return func.replace(/\\/\\/.*$/gm,"").replace(/\\n/g,"").replace(/(.*)\\(\\)\\{(.*)\\}/,"$2");
}

function crCheckCache(action,funcName, cacheName,cacheString,funcTemplate,isLoop=false) {
	let rObject={};
	rObject.txt=cacheString+"."+cacheName+"={};";
	rObject.toEdit=false;

	let cObject=creatorCache[action.name]
	let cacheExists= cObject!=undefined;

	if (cacheExists&&isLoop) {
		cObject=cObject.loop;
		cacheExists= cObject!=undefined;
	}
	if (cacheExists) {
        cObject= cObject[cacheName];
		cacheExists= cObject!=undefined;
	}

	if (funcName==="finish") {
		let hasFinish= typeof action.finish=="function";

		if (typeof action.skills=="object") {
			hasFinish=true;
			rObject.txt+=cacheString+"."+cacheName+".skills={};";
			for (sk in action.skills) {
				if (typeof action.skills[sk]=="function") {
					rObject.txt+="\t"+cacheString+"."+cacheName+".skills."+sk+"=\\\\\\\`"+action.skills[sk].toString().replace(/\`/g,"'").replace(/\\\$/g,"@")+"\\\\\\\`,";
					rObject.toEdit=cacheExists&&(rObject.toEdit|| (!cObject.skills) || crStripFunction(cObject.skills[sk])!=crStripFunction(action.skills[sk]));
				} else {
					rObject.txt+="\t"+cacheString+"."+cacheName+".skills."+sk+"="+action.skills[sk]+",";
					rObject.toEdit=cacheExists&&(rObject.toEdit|| (!cObject.skills) ||cObject.skills[sk]!=action.skills[sk]);
				}
			}
		}
		if (typeof action.skillsSquirrel=="object") {
			hasFinish=true;
			rObject.txt+=cacheString+"."+cacheName+".skillsSquirrel={};";
			for (sk in action.skillsSquirrel) {
				if (typeof action.skillsSquirrel[sk]=="function") {
					rObject.txt+="\t"+cacheString+"."+cacheName+".skillsSquirrel."+sk+"=\\\\\\\`"+action.skillsSquirrel[sk].toString().replace(/\`/g,"'").replace(/\\\$/g,"@")+"\\\\\\\`,";
					rObject.toEdit=cacheExists&&(rObject.toEdit|| (!cObject.skillsSquirrel) || crStripFunction(cObject.skillsSquirrel[sk])!=crStripFunction(action.skillsSquirrel[sk]));
				} else {
					rObject.txt+="\t"+cacheString+"."+cacheName+".skillsSquirrel."+sk+"="+action.skillsSquirrel[sk]+",";
				}
			}
		}
		if (typeof action.cost=="function") {
			hasFinish=true;
			rObject.txt+=cacheString+"."+cacheName+".cost=\\\\\\\`"+action.cost.toString().replace(/\`/g,"'").replace(/\\\$/g,"@")+"\\\\\\\`;";
			rObject.toEdit=cacheExists&&(rObject.toEdit||crStripFunction(cObject.cost)!=crStripFunction(action.cost));
		}
		if (typeof action.squirrelActionEffect=="function") {
			hasFinish=true;
			rObject.txt+=cacheString+"."+cacheName+".squirrel=\\\\\\\`"+action.squirrelActionEffect.toString().replace(/\`/g,"'").replace(/\\\$/g,"@")+"\\\\\\\`;";
			rObject.toEdit=cacheExists&&(rObject.toEdit||crStripFunction(cObject.squirrel)!=crStripFunction(action.squirrelActionEffect));
		}
		if (!hasFinish) {
			rObject.txt="";
			return rObject;
		}
	}
	rObject.txt+=cacheString+"."+cacheName+".game=\\\\\\\`"+action[funcName].toString().replace(/\`/g,"'").replace(/\\\$/g,"@")+"\\\\\\\`;";


	if (cacheExists) {
		//Entry exists in the cache
		if (rObject.toEdit||crStripFunction(cObject.game)!=crStripFunction(action[funcName])) { //Function changed from the cache
			rObject.toEdit=true;
			rObject.txt+=\`\n//TODO: Check validity\`;
		}
		rObject.txt+=cacheString+"."+cacheName+".pred=\\\\\\\`"+cObject.pred+"\\\\\\\`;";
	} else {
		if (crStripFunction(action[funcName])=="") {
			rObject.txt+=cacheString+"."+cacheName+".pred='';";
		} else if (!isLoop && Koviko.predictions[action.name]&&Koviko.predictions[action.name][cacheName]) {
			rObject.txt+=cacheString+"."+cacheName+".pred=\\\\\\\`"+Koviko.predictions[action.name][cacheName].toString().replace(/\`/g,"\\\\\\\`")+"\\\\\\\`;";
		} else if (isLoop &&(Koviko.predictions[action.name])&&(Koviko.predictions[action.name].loop)&&(Koviko.predictions[action.name].loop[cacheName])) {
			rObject.txt+=cacheString+"."+cacheName+".pred=\\\\\\\`"+Koviko.predictions[action.name].loop[cacheName].toString().replace(/\`/g,"\\\\\\\`")+"\\\\\\\`;";
		} else if (isLoop &&(Koviko.predictions[action.name])&&(Koviko.predictions[action.name].loop)&&(Koviko.predictions[action.name].loop.effect)&&(Koviko.predictions[action.name].loop.effect[cacheName])) {
			rObject.txt+=cacheString+"."+cacheName+".pred=\\\\\\\`"+Koviko.predictions[action.name].loop.effect[cacheName].toString().replace(/\`/g,"\\\\\\\`")+"\\\\\\\`;";
		} else {
			rObject.toEdit=true;
			rObject.txt+=cacheString+"."+cacheName+".pred=\\\\\\\`"+funcTemplate+"\\\\\\\`;";
		}

	}
    return rObject;
}

function crOutputPredictions() {
	let output="";
	for (let act in Action ) {

		//Special Cases
		if (Action[act].name.startsWith("Survey")) {
			continue;
		}
		if (Action[act].name.startsWith("AssassinZ")) {
			continue;
		}
		let itemCache=creatorCache[Action[act].name];
		if (!itemCache) {
			console.log("Error, action not found?");
		}
		output+=\`\n        '\`+Action[act].name+\`':{ affected:['\`+itemCache.affected.toString().replace(/,/g,"','")+"']";
		if (itemCache.manaCost && itemCache.manaCost.pred) {
			output+=\`, manaCost:\`+itemCache.manaCost.pred;
		}
		if (itemCache.canStart && itemCache.canStart.pred) {
			output+=\`,\n          canStart:\`+itemCache.canStart.pred;
		}
		if (itemCache.effect && itemCache.effect.pred) {
			output+=\`,\n          effect:\`+itemCache.effect.pred;
		}
		if (itemCache.loop) {
			output+=\`, loop: {\`;
			if (itemCache.loop.max) {
				output+=\`\n          max:\`+itemCache.loop.max+",";
			}
			if (itemCache.loop.cost) {
				output+=\`\n          cost:\`+itemCache.loop.cost.pred+",";
			}
			if (itemCache.loop.tick) {
				output+=\`\n          tick:\`+itemCache.loop.tick.pred+",";
			}
			output+=\`\n          effect:{\`;
			let needsDiv=false
			if (itemCache.loop.end&&itemCache.loop.end.pred) {
				needsDiv?output+=", ":needsDiv=true;
				output+=\` end:\`+itemCache.loop.end.pred;
			}
			if (itemCache.loop.segment&&itemCache.loop.segment.pred) {
				needsDiv?output+=", ":needsDiv=true;
				output+=\`segment:\`+itemCache.loop.segment.pred;
			}
			if (itemCache.loop.loop && itemCache.loop.loop.pred) {
				needsDiv?output+=", ":needsDiv=true;
				output+=\`loop:\`+itemCache.loop.loop.pred;
			}
			output+=\`}\n        }\`;
		}
		output+="},";
	}
	console.log(output);
}



function crUpdatePredictions() {
	let output="";
	let rObject;
	let editCount=0;

	for (let act in Action ) {

		//skip some special Actions
		if (Action[act].name.startsWith("Survey")) {
			continue;
		}
		if (Action[act].name.startsWith("AssassinZ")) {
			continue;
		}


		let toEdit=false;
		let cacheString=\`\ncreatorCache['\`+Action[act].name+\`']\`;
		let item=cacheString+"={};";
		

		if (creatorCache[Action[act].name] && creatorCache[Action[act].name].affected) {
			item+=cacheString+".affected=['"+creatorCache[Action[act].name].affected.toString().replace(/,/g,"','")+"'];"; 
		} else if (Koviko.predictions[Action[act].name] &&Koviko.predictions[Action[act].name].affected){
			item+=cacheString+".affected=['"+Koviko.predictions[Action[act].name].affected.toString().replace(/,/g,"','")+"'];"; 
		} else {
			item+=cacheString+".affected=[];"
		}

		if ((typeof Action[act].manaCost=="function")&&isNaN(crStripFunction(Action[act].manaCost).replace(/return([0-9]*);/,"$1"))) {//if manaCost is numeric don't cache it
			rObject=crCheckCache(Action[act],"manaCost", "manaCost",cacheString,\`(r,k) => {\n//TODO: Add function\n        }\`)
			item+=rObject.txt;
			toEdit=toEdit||rObject.toEdit;
		}
		if(typeof Action[act].canStart=="function") {
			rObject=crCheckCache(Action[act],"canStart", "canStart",cacheString,\`(input) => {\n//TODO: Add function\n        }\`)
			item+=rObject.txt;
			toEdit=toEdit||rObject.toEdit;
		}

		if(Action[act].type=="multipart") {
			cacheString+=".loop";
			item+=cacheString+"={};";
			if(typeof Action[act].loopCost=="function") {
				rObject=crCheckCache(Action[act],"loopCost", "cost",cacheString,\`(p) => segment =>  precision3(Math.pow(1.2, p.completed + segment)) //TODO: Add function\`,true)
				item+=rObject.txt;
				toEdit=toEdit||rObject.toEdit;
			}
			if(typeof Action[act].tickProgress=="function") {
				rObject=crCheckCache(Action[act],"tickProgress", "tick",cacheString,\`(p, a, s, k, r) => offset => h.getStatProgress(p, a, s, offset, 100) * Math.sqrt(1 + p.total / 1000) //TODO: Add function\`,true)
				item+=rObject.txt;
				toEdit=toEdit||rObject.toEdit;
			}

			if(typeof Action[act].finish=="function") {
				rObject=crCheckCache(Action[act],"finish", "end",cacheString,\`(r,k) => {/*TODO: Add function*/}\`,true)
				item+=rObject.txt;
				toEdit=toEdit||rObject.toEdit;
			}
			if(typeof Action[act].segmentFinished=="function") {
				rObject=crCheckCache(Action[act],"segmentFinished", "segment",cacheString,\`(r,k) => {/*TODO: Add function*/}\`,true)
				item+=rObject.txt;
				toEdit=toEdit||rObject.toEdit;
			}
			if(typeof Action[act].loopsFinished=="function") {
				rObject=crCheckCache(Action[act],"loopsFinished", "loop",cacheString,\`(r,k) => {/*TODO: Add function*/}\`,true)
				item+=rObject.txt;
				toEdit=toEdit||rObject.toEdit;
			}

			//loop.max
			if (creatorCache[Action[act].name] && creatorCache[Action[act].name].loop  && creatorCache[Action[act].name].loop.max!=undefined ) {
				item+=cacheString+".max=\\\\\\\`"+creatorCache[Action[act].name].loop.max+"\\\\\\\`;";
			}else if ((Koviko.predictions[Action[act].name])&&(Koviko.predictions[Action[act].name].loop)&&(Koviko.predictions[Action[act].name].loop.max)) {
					item+=cacheString+".max=\\\\\\\`"+Koviko.predictions[Action[act].name].loop.max.toString().replace(/\`/g,"\\\\\\\`")+"\\\\\\\`;";
			} else if (toEdit) {
				item+=cacheString+".max=\\\\\\\`()=>1 //TODO: check if cap relevant, replace with empty String otherwise\\\\\\\`;"; 
			}
		} else {
			//For multipart actions the effect is stored inside the loop object
			rObject=crCheckCache(Action[act],"finish", "effect",cacheString,\`(r,k) => {\n//TODO: Add function\n        }\`);
			item+=rObject.txt;
			toEdit=toEdit||rObject.toEdit;
		}
		output+=item;
		if (toEdit) {
			editCount++;
		}
	}
	console.log(output);
	if (editCount>0) {
		console.log(editCount+" Actions require updates");
	} else {
		console.log("All actions are up to date, use crOutputPredictions() to generate a usable prediction String for the Predictor");
	}
}

//CACHE File





creatorCache['RuinsZ1']={};
creatorCache['RuinsZ1'].affected=[''];
creatorCache['RuinsZ1'].effect={};
creatorCache['RuinsZ1'].effect.game=\`finish() {
            towns[this.townNum].finishProgress(this.varName, 1);
            adjustRocks(this.townNum);
        }\`;
creatorCache['RuinsZ1'].effect.pred=\`\`;
creatorCache['RuinsZ3']={};
creatorCache['RuinsZ3'].affected=[''];
creatorCache['RuinsZ3'].effect={};
creatorCache['RuinsZ3'].effect.game=\`finish() {
            towns[this.townNum].finishProgress(this.varName, 1);
            adjustRocks(this.townNum);
        }\`;
creatorCache['RuinsZ3'].effect.pred=\`\`;
creatorCache['RuinsZ5']={};
creatorCache['RuinsZ5'].affected=[''];
creatorCache['RuinsZ5'].effect={};
creatorCache['RuinsZ5'].effect.game=\`finish() {
            towns[this.townNum].finishProgress(this.varName, 1);
            adjustRocks(this.townNum);
        }\`;
creatorCache['RuinsZ5'].effect.pred=\`\`;
creatorCache['RuinsZ6']={};
creatorCache['RuinsZ6'].affected=[''];
creatorCache['RuinsZ6'].effect={};
creatorCache['RuinsZ6'].effect.game=\`finish() {
            towns[this.townNum].finishProgress(this.varName, 1);
            adjustRocks(this.townNum);
        }\`;
creatorCache['RuinsZ6'].effect.pred=\`\`;
creatorCache['HaulZ1']={};
creatorCache['HaulZ1'].affected=['stone'];
creatorCache['HaulZ1'].canStart={};
creatorCache['HaulZ1'].canStart.game=\`canStart() {
            return !resources.stone && stonesUsed[this.townNum] < 250;
        }\`;
creatorCache['HaulZ1'].canStart.pred=\`(input)=>((input.stone||0)<1 && stonesUsed[1] < 250)\`;
creatorCache['HaulZ1'].effect={};
creatorCache['HaulZ1'].effect.game=\`finish() {
            stoneLoc = this.townNum;
            towns[this.townNum].finishRegular(this.varName, 1000, () => {
                addResource("stone", true);
            });
        }\`;
creatorCache['HaulZ1'].effect.pred=\`(r) => {
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
        }\`;
creatorCache['HaulZ3']={};
creatorCache['HaulZ3'].affected=['stone'];
creatorCache['HaulZ3'].canStart={};
creatorCache['HaulZ3'].canStart.game=\`canStart() {
            return !resources.stone && stonesUsed[this.townNum] < 250;
        }\`;
creatorCache['HaulZ3'].canStart.pred=\`(input)=>((input.stone||0)<1 && stonesUsed[3] < 250)\`;
creatorCache['HaulZ3'].effect={};
creatorCache['HaulZ3'].effect.game=\`finish() {
            stoneLoc = this.townNum;
            towns[this.townNum].finishRegular(this.varName, 1000, () => {
                addResource("stone", true);
            });
        }\`;
creatorCache['HaulZ3'].effect.pred=\`(r) => {
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
        }\`;
creatorCache['HaulZ5']={};
creatorCache['HaulZ5'].affected=['stone'];
creatorCache['HaulZ5'].canStart={};
creatorCache['HaulZ5'].canStart.game=\`canStart() {
            return !resources.stone && stonesUsed[this.townNum] < 250;
        }\`;
creatorCache['HaulZ5'].canStart.pred=\`(input)=>((input.stone||0)<1 && stonesUsed[5] < 250)\`;
creatorCache['HaulZ5'].effect={};
creatorCache['HaulZ5'].effect.game=\`finish() {
            stoneLoc = this.townNum;
            towns[this.townNum].finishRegular(this.varName, 1000, () => {
                addResource("stone", true);
            });
        }\`;
creatorCache['HaulZ5'].effect.pred=\`(r) => {
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
        }\`;
creatorCache['HaulZ6']={};
creatorCache['HaulZ6'].affected=['stone'];
creatorCache['HaulZ6'].canStart={};
creatorCache['HaulZ6'].canStart.game=\`canStart() {
            return !resources.stone && stonesUsed[this.townNum] < 250;
        }\`;
creatorCache['HaulZ6'].canStart.pred=\`(input)=>((input.stone||0)<1 && stonesUsed[6] < 250)\`;
creatorCache['HaulZ6'].effect={};
creatorCache['HaulZ6'].effect.game=\`finish() {
            stoneLoc = this.townNum;
            towns[this.townNum].finishRegular(this.varName, 1000, () => {
                addResource("stone", true);
            });
        }\`;
creatorCache['HaulZ6'].effect.pred=\`(r) => {
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
        }\`;
creatorCache['Look Around']={};
creatorCache['Look Around'].affected=[''];
creatorCache['Look Around'].manaCost={};
creatorCache['Look Around'].manaCost.game=\`manaCost() {
        return 30000 * (Math.pow(2, towns[SANCTUARY].getLevel(this.varName))) / (Math.pow(6, getBuffLevel("SpiritBlessing")));
    }\`;
creatorCache['Look Around'].manaCost.pred=\`\`;
creatorCache['Look Around'].canStart={};
creatorCache['Look Around'].canStart.game=\`canStart() {
		const squirrelRequirements = (!this.squirrelAction || resources.squirrel);
		return squirrelRequirements && resources.glasses;
    }\`;
creatorCache['Look Around'].canStart.pred=\`(input) => (input.glasses)\`;
creatorCache['Look Around'].effect={};
creatorCache['Look Around'].effect.squirrel=\`squirrelActionEffect(onlyGetLoseSquirrel, onlyGetEmptySquirrel) {
		
		let actionEffect = () => {};
		let loseSquirrel = false;
		
		let nothingHappens = false;
		
		switch(getLevelSquirrelAction("Look Around")){
						
				case 1: break;
										
		}
		
		if(onlyGetLoseSquirrel){
			if(loseSquirrel) return true;
			return false;
		}
		
		if(onlyGetEmptySquirrel){
			if(String(actionEffect) === "() => {}" || nothingHappens === true) return true;
			return false;
		}
		
		if(loseSquirrel) addResource("squirrel", false);
		
		actionEffect();
	}\`;
creatorCache['Look Around'].effect.game=\`finish() {
		
		towns[SANCTUARY].finishProgress(this.varName, 100);
		view.adjustManaCost("Look Around");

    }\`;
creatorCache['Look Around'].effect.pred=\`\`;
creatorCache['Absorb Mana']={};
creatorCache['Absorb Mana'].affected=[''];
creatorCache['Absorb Mana'].canStart={};
creatorCache['Absorb Mana'].canStart.game=\`canStart() {
		const squirrelRequirements = (!this.squirrelAction || resources.squirrel);
		return squirrelRequirements;
    }\`;
creatorCache['Absorb Mana'].canStart.pred=\`true\`;
creatorCache['Absorb Mana'].effect={};
creatorCache['Absorb Mana'].effect.squirrel=\`squirrelActionEffect(onlyGetLoseSquirrel, onlyGetEmptySquirrel) {
		
		let actionEffect = () => {};
		let loseSquirrel = false;
		let nothingHappens = false;
		
		switch(getLevelSquirrelAction("Absorb Mana")){
						
				case 1: break;
										
		}
		
		if(onlyGetLoseSquirrel){
			if(loseSquirrel) return true;
			return false;
		}
		
		if(onlyGetEmptySquirrel){
			if(String(actionEffect) === "() => {}" || nothingHappens === true) return true;
			return false;
		}
		
		if(loseSquirrel) addResource("squirrel", false);
		
		actionEffect();
	}\`;
creatorCache['Absorb Mana'].effect.game=\`finish() {
		
		const manaGain = this.goldCost();
		towns[SANCTUARY].finishRegular(this.varName, 10, () => {
			addMana(manaGain);	
			return manaGain;
		});
		view.adjustGoldCost("ManaSpots", this.goldCost());
			
    }\`;
creatorCache['Absorb Mana'].effect.pred=\`(r,k,sq) => {
          if (sq) return;
          const manaBase = 100000;
          const exponent = 1 + (getBuffLevel("SpiritBlessing") * 0.02);
          r.manaAbsorb = (r.manaAbsorb || 0)+1;
          r.mana += r.manaAbsorb <= towns[SANCTUARY].goodManaSpots ?  Math.floor(manaBase * Math.pow(exponent, r.manaAbsorb -1)) : 0;
        }\`;
creatorCache['Imbue Squirrel']={};
creatorCache['Imbue Squirrel'].affected=['ImbueSoulStone'];
creatorCache['Imbue Squirrel'].manaCost={};
creatorCache['Imbue Squirrel'].manaCost.game=\`manaCost(squirrelTooltip) {
		const squirrelMod = (((this.squirrelAction || squirrelTooltip) && getLevelSquirrelAction("Imbue Squirrel") >= 1) ? 1 : 0);
        return 3500 * Math.pow(3, getBuffLevel("SpiritBlessing")  - squirrelMod);
    }\`;
creatorCache['Imbue Squirrel'].manaCost.pred=\`\`;
creatorCache['Imbue Squirrel'].canStart={};
creatorCache['Imbue Squirrel'].canStart.game=\`canStart() {
		const squirrelRequirements = (!this.squirrelAction || resources.squirrel);
		return squirrelRequirements;
    }\`;
creatorCache['Imbue Squirrel'].canStart.pred=\`\`;
creatorCache['Imbue Squirrel'].effect={};
creatorCache['Imbue Squirrel'].effect.skillsSquirrel={};	
creatorCache['Imbue Squirrel'].effect.skillsSquirrel.Magic=\`Magic() {
			const squirrelMod = ((this.squirrelAction && getLevelSquirrelAction("Imbue Squirrel") >= 1) ? 1 : 0);
			return Math.pow(4, getBuffLevel("SpiritBlessing") - squirrelMod);
		}\`,
creatorCache['Imbue Squirrel'].effect.squirrel=\`squirrelActionEffect(onlyGetLoseSquirrel, onlyGetEmptySquirrel) {
		
		let actionEffect = () => {};
		let loseSquirrel = false;
		let nothingHappens = false;
		
		switch(getLevelSquirrelAction("Imbue Squirrel")){
						
			case 1: actionEffect = () => {
						handleSkillSquirrelExp(this.skillsSquirrel);
						view.adjustManaCost("Imbue Squirrel", squirrelMode);
					};
				break;
									
		}
		
		if(onlyGetLoseSquirrel){
			if(loseSquirrel) return true;
			return false;
		}
		
		if(onlyGetEmptySquirrel){
			if(String(actionEffect) === "() => {}" || nothingHappens === true) return true;
			return false;
		}
		
		if(loseSquirrel) addResource("squirrel", false);
		
		actionEffect();
	}\`;
creatorCache['Imbue Squirrel'].effect.game=\`finish() {
		
		handleSkillSquirrelExp(this.skillsSquirrel);
		
    }\`;
creatorCache['Imbue Squirrel'].effect.pred=\`(r,k,sq) => {
            k.magic_squirrel+=Math.pow(4, getBuffLevel("SpiritBlessing")- (sq?1:0));
        }\`;
creatorCache['Imbue Soulstones']={};
creatorCache['Imbue Soulstones'].affected=[''];
creatorCache['Imbue Soulstones'].canStart={};
creatorCache['Imbue Soulstones'].canStart.game=\`canStart() {
		const squirrelRequirements = (!this.squirrelAction || resources.squirrel);
		return squirrelRequirements && this.getMinimumSoulstones();
    }\`;
creatorCache['Imbue Soulstones'].canStart.pred=\`(input) => {
          return Action.ImbueSoulstones.getMinimumSoulstones();
        }\`;
creatorCache['Imbue Soulstones'].effect={};
creatorCache['Imbue Soulstones'].effect.squirrel=\`squirrelActionEffect(onlyGetLoseSquirrel, onlyGetEmptySquirrel) {
		
		let actionEffect = () => {};
		let loseSquirrel = false;
		let nothingHappens = false;
		
		switch(getLevelSquirrelAction("Imbue Soulstones")){
						
			case 1: break;
									
		}
		
		if(onlyGetLoseSquirrel){
			if(loseSquirrel) return true;
			return false;
		}
		
		if(onlyGetEmptySquirrel){
			if(String(actionEffect) === "() => {}" || nothingHappens === true) return true;
			return false;
		}
		
		if(loseSquirrel) addResource("squirrel", false);
		
		actionEffect();
	}\`;
creatorCache['Imbue Soulstones'].effect.game=\`finish() {
		
		addBuffAmt("ImbueSoulstones", 1);
		view.updateStartingMana();
		view.adjustGoldCost(this.varName, this.goldCost());
		
    }\`;
creatorCache['Imbue Soulstones'].effect.pred=\`(r,k,sq) => {
          if (sq) return;
          r.ImbueSoulStone+=1;
        }\`;
creatorCache['Balance Soulstones']={};
creatorCache['Balance Soulstones'].affected=[''];
creatorCache['Balance Soulstones'].canStart={};
creatorCache['Balance Soulstones'].canStart.game=\`canStart() {
		const squirrelRequirements = (!this.squirrelAction || resources.squirrel);
		return squirrelRequirements;
    }\`;
creatorCache['Balance Soulstones'].canStart.pred=\`true\`;
creatorCache['Balance Soulstones'].effect={};
creatorCache['Balance Soulstones'].effect.squirrel=\`squirrelActionEffect(onlyGetLoseSquirrel, onlyGetEmptySquirrel) {
		
		let actionEffect = () => {};
		let loseSquirrel = false;
		let nothingHappens = false;
		
		switch(getLevelSquirrelAction("Balance Soulstones")){
						
			case 1: break;
									
		}
		
		if(onlyGetLoseSquirrel){
			if(loseSquirrel) return true;
			return false;
		}
		
		if(onlyGetEmptySquirrel){
			if(String(actionEffect) === "() => {}" || nothingHappens === true) return true;
			return false;
		}
		if(loseSquirrel) addResource("squirrel", false);
		
		actionEffect();
	}\`;
creatorCache['Balance Soulstones'].effect.game=\`finish() {
		
		let statWithLessSoulstones = "Dex";
		let statWithMostSoulstones = "Dex";
		
		for (const stat of statList) {
			if(stats[stat].soulstone > stats[statWithMostSoulstones].soulstone) statWithMostSoulstones = stat;
			if(stats[stat].soulstone < stats[statWithLessSoulstones].soulstone) statWithLessSoulstones = stat;
		}
		
		stats[statWithMostSoulstones].soulstone --;
		stats[statWithLessSoulstones].soulstone ++;
		
		view.updateSoulstones();
		
    }\`;
creatorCache['Balance Soulstones'].effect.pred=\`\`;
creatorCache['Mysterious Voice']={};
creatorCache['Mysterious Voice'].affected=['blessing'];
creatorCache['Mysterious Voice'].canStart={};
creatorCache['Mysterious Voice'].canStart.game=\`canStart() {
		const squirrelRequirements = (!this.squirrelAction || resources.squirrel);
		return squirrelRequirements;
    }\`;
creatorCache['Mysterious Voice'].canStart.pred=\`true\`;
creatorCache['Mysterious Voice'].effect={};
creatorCache['Mysterious Voice'].effect.squirrel=\`squirrelActionEffect(onlyGetLoseSquirrel, onlyGetEmptySquirrel) {
		
		let actionEffect = () => {};
		let loseSquirrel = false;
		let nothingHappens = false;
		
		switch(getLevelSquirrelAction("Mysterious Voice")){
						
			case 1: actionEffect = () => {
						if(getBuffLevel("SpiritBlessing") == 1) {
							addBuffAmt("SpiritBlessing", 1);
							view.updateActionTooltips();
							view.adjustManaCost("Look Around");
							view.adjustManaCost("Imbue Squirrel");
							view.adjustGoldCost("ImbueSquirrel", Action.ImbueSquirrel.goldCost());
						}
					};
					if(getBuffLevel("SpiritBlessing") !== 1) nothingHappens;
					break;
			
			case 2:	 actionEffect = () => {
						if(getBuffLevel("SpiritBlessing") == 1) {
							addBuffAmt("SpiritBlessing", 1);
							view.updateActionTooltips();
							view.adjustManaCost("Look Around");
							view.adjustManaCost("Imbue Squirrel");
							view.adjustGoldCost("ImbueSquirrel", Action.ImbueSquirrel.goldCost());
						}
						// Set the mana to 1000.
						timer = timeNeeded - 1001;
						unlockTown(CHRONOSLAIR);
					};
					loseSquirrel = true;
					break;
										
		}
		
		if(onlyGetLoseSquirrel){
			if(loseSquirrel) return true;
			return false;
		}
		
		if(onlyGetEmptySquirrel){
			if(String(actionEffect) === "() => {}" || nothingHappens === true) return true;
			return false;
		}
		
		if(loseSquirrel) addResource("squirrel", false);
		
		actionEffect();
	}\`;
creatorCache['Mysterious Voice'].effect.game=\`finish() {
		
		switch(getBuffLevel("SpiritBlessing")){
			case 0: addBuffAmt("SpiritBlessing", 1);
				break;
			case 1: break;
			case 2: if(resources.stolenGoods >= 10) addBuffAmt("SpiritBlessing", 1);
				break;
			case 3: if(resources.herbs >= 100) addBuffAmt("SpiritBlessing", 1);
				break;
			case 4: break;
		}
		view.updateActionTooltips();
		view.adjustManaCost("Look Around");
		view.adjustManaCost("Imbue Squirrel");
		view.adjustGoldCost("ImbueSquirrel", Action.ImbueSquirrel.goldCost());
		view.updateBuffCaps(true);
		view.adjustGoldCost("BalanceSoulstones", Action.BalanceSoulstones.goldCost());
		
    }\`;
creatorCache['Mysterious Voice'].effect.pred=\`(r,k,sq) => {
		  switch(getBuffLevel("SpiritBlessing")){
            case 0: r.blessing+=1;
            case 1: if(sq) r.blessing+=1;
            case 2: if(r.stolenGoods >= 10) r.blessing+=1;
            case 3: if(r.herbs >= 100) r.blessing+=1;
            case 4: break;
          }
        }\`;
creatorCache['Wander']={};
creatorCache['Wander'].affected=[''];
creatorCache['Wander'].canStart={};
creatorCache['Wander'].canStart.game=\`canStart() {
		const squirrelRequirements = (!this.squirrelAction || resources.squirrel);
		return squirrelRequirements;
    }\`;
creatorCache['Wander'].canStart.pred=\`true\`;
creatorCache['Wander'].effect={};
creatorCache['Wander'].effect.squirrel=\`squirrelActionEffect(onlyGetLoseSquirrel, onlyGetEmptySquirrel) {
		
		let actionEffect = () => {};
		let loseSquirrel = false;
		let nothingHappens = false;
		
		switch(getLevelSquirrelAction("Wander")){
						
			case 1: loseSquirrel = true;
					break;
					
			case 2: break;
			
			case 3: actionEffect = () => {
						adjustPots();
						view.updateRegular("Pots", BEGINNERSVILLE);
					};
					nothingHappens = true;
					break;
			
			case 4: actionEffect = () => {
						adjustPots();
						view.updateRegular("Pots", BEGINNERSVILLE);
					};
					nothingHappens = true;
					break;
			
		}
		
		if(onlyGetLoseSquirrel){
			if(loseSquirrel) return true;
			return false;
		}
		
		if(onlyGetEmptySquirrel){
			if(String(actionEffect) === "() => {}" || nothingHappens === true) return true;
			return false;
		}
		
		if(loseSquirrel) addResource("squirrel", false);
		
		actionEffect();
	}\`;
creatorCache['Wander'].effect.game=\`finish() {
		
		towns[BEGINNERSVILLE].finishProgress(this.varName, 200 * (resources.glasses ? 4 : 1));
		
    }\`;
creatorCache['Wander'].effect.pred=\`(r,k,sq)=>{
          if (sq && getLevelSquirrelAction("Wander")<=1)
            h.killSquirrel(r);
        }\`;
creatorCache['Smash Pots']={};
creatorCache['Smash Pots'].affected=['mana'];
creatorCache['Smash Pots'].manaCost={};
creatorCache['Smash Pots'].manaCost.game=\`manaCost(squirrelTooltip) {
		let squirrelManaMult = (((this.squirrelAction || squirrelTooltip) && getLevelSquirrelAction("Smash Pots") >= 3) ? 0.8 : 1);
		if(squirrelManaMult === 0.8 && getLevelSquirrelAction("Smash Pots") >= 4) squirrelManaMult = 0.65;
        return Math.ceil(100 * squirrelManaMult);
    }\`;
creatorCache['Smash Pots'].manaCost.pred=\`\`;
creatorCache['Smash Pots'].canStart={};
creatorCache['Smash Pots'].canStart.game=\`canStart() {
		const squirrelRequirements = (!this.squirrelAction || resources.squirrel);
		return squirrelRequirements;
    }\`;
creatorCache['Smash Pots'].canStart.pred=\`true\`;
creatorCache['Smash Pots'].effect={};
creatorCache['Smash Pots'].effect.squirrel=\`squirrelActionEffect(onlyGetLoseSquirrel, onlyGetEmptySquirrel) {
		
		let actionEffect = () => {};
		let loseSquirrel = false;
		let nothingHappens = false;
		
		switch(getLevelSquirrelAction("Smash Pots")){
						
				case 1: break;
						
				case 2: break;
				
				case 3: actionEffect = () => {
							view.adjustManaCost("Smash Pots", squirrelMode);
							towns[BEGINNERSVILLE].finishRegular(this.varName, 10, () => {
								const manaGain = this.goldCost();
								addMana(manaGain);
								return manaGain;
							});
						};
						break;
						
				case 4:  actionEffect = () => {
							view.adjustManaCost("Smash Pots", squirrelMode);
							towns[BEGINNERSVILLE].finishRegular(this.varName, 10, () => {
								const manaGain = this.goldCost();
								addMana(manaGain);
								return manaGain;
							});
						};
						break;
				
			}
		
		if(onlyGetLoseSquirrel){
			if(loseSquirrel) return true;
			return false;
		}
	
		if(onlyGetEmptySquirrel){
			if(String(actionEffect) === "() => {}" || nothingHappens === true) return true;
			return false;
		}
		
		if(loseSquirrel) addResource("squirrel", false);
		
		actionEffect();
	}\`;
creatorCache['Smash Pots'].effect.game=\`finish() {
        	
		towns[BEGINNERSVILLE].finishRegular(this.varName, 10, () => {
			const manaGain = this.goldCost();
			addMana(manaGain);
			return manaGain;
		});
		
    }\`;
creatorCache['Smash Pots'].effect.pred=\`(r,k,sq) => {
          if (sq && getLevelSquirrelAction("Smash Pots")<3) {
            return; //No effect
          }
          r.temp1 = (r.temp1 || 0) + 1;
          r.mana += r.temp1 <= towns[0].goodPots ?  Action.SmashPots.goldCost() : 0;
        }\`;
creatorCache['Pet Squirrel']={};
creatorCache['Pet Squirrel'].affected=[''];
creatorCache['Pet Squirrel'].manaCost={};
creatorCache['Pet Squirrel'].manaCost.game=\`manaCost(squirrelTooltip) {
		if((this.squirrelAction || squirrelTooltip) && getLevelSquirrelAction("Pet Squirrel") >= 3) return 2500;
        return 100 + getSkillSquirrelLevel("Trust") * 100;
    }\`;
creatorCache['Pet Squirrel'].manaCost.pred=\`(r,k,sq) => {
          if(sq && getLevelSquirrelAction("Pet Squirrel") >= 3) return 2500;
          return 100 + getSkillSquirrelLevelFromExp(k.trust_squirrel) * 100;
        }\`;
creatorCache['Pet Squirrel'].canStart={};
creatorCache['Pet Squirrel'].canStart.game=\`canStart() {
        if(this.squirrelAction){
			if(getLevelSquirrelAction("Pet Squirrel") >= 3) return (resources.squirrel && resources.reputation >= 2)
			return resources.squirrel;
		}
		if(getLevelSquirrelAction("Pet Squirrel") >= 2 && !resources.squirrel ) return false;
		if(getLevelSquirrelAction("Pet Squirrel") < 2 && !resources.squirrel && squirrelAlreadyPickedUp) return false;
		return true;
    }\`;
creatorCache['Pet Squirrel'].canStart.pred=\`(input,sq) => {
          if(sq){
		    if(getLevelSquirrelAction("Pet Squirrel") >= 3) return (input.rep >= 2)
            return true;
          }
          if(getLevelSquirrelAction("Pet Squirrel") >= 2 && !input.squirrel ) return false;
          if(getLevelSquirrelAction("Pet Squirrel") < 2 && !input.squirrel && input.deadSquirrel) return false;
		return true;
        }\`;
creatorCache['Pet Squirrel'].effect={};
creatorCache['Pet Squirrel'].effect.skillsSquirrel={};	
creatorCache['Pet Squirrel'].effect.skillsSquirrel.Trust=100,
creatorCache['Pet Squirrel'].effect.squirrel=\`squirrelActionEffect(onlyGetLoseSquirrel, onlyGetEmptySquirrel) {
		
		let actionEffect = () => {};
		let loseSquirrel = false;
		let nothingHappens = false;
		
		switch(getLevelSquirrelAction("Pet Squirrel")){
						
				case 1: break;
						
				case 2: //get the squirrel with you from the start of every loop : managed somewhere else.
						break;
				
				case 3: actionEffect = () => {
							handleSkillSquirrelExp(this.skillsSquirrel);
							handleSkillSquirrelExp(this.skillsSquirrel);
							view.adjustManaCost("Pet Squirrel", squirrelMode);
						};
						break;
				
		}
		
		if(onlyGetLoseSquirrel){
			if(loseSquirrel) return true;
			return false;
		}
		
		if(onlyGetEmptySquirrel){
			if(String(actionEffect) === "() => {}" || nothingHappens === true) return true;
			return false;
		}
		
		if(loseSquirrel) addResource("squirrel", false);
		
		actionEffect();
	}\`;
creatorCache['Pet Squirrel'].effect.game=\`finish() {	
	
		addResource("squirrel", true);
		handleSkillSquirrelExp(this.skillsSquirrel);
		view.adjustManaCost("Pet Squirrel", squirrelMode);
		squirrelAlreadyPickedUp = true;
    }\`;
creatorCache['Pet Squirrel'].effect.pred=\`(r,k,sq) => {
          if (sq) {
            if (getLevelSquirrelAction("Pet Squirrel")>=3) {
              k.trust_squirrel+=200;
            }
          } else {
            k.trust_squirrel+=100;
            r.squirrel=1;
          }
        }\`;
creatorCache['Pick Locks']={};
creatorCache['Pick Locks'].affected=['gold','stolenGoods','mana'];
creatorCache['Pick Locks'].canStart={};
creatorCache['Pick Locks'].canStart.game=\`canStart() {
		const squirrelRequirements = (!this.squirrelAction || resources.squirrel);
		return squirrelRequirements;
    }\`;
creatorCache['Pick Locks'].canStart.pred=\`true\`;
creatorCache['Pick Locks'].effect={};
creatorCache['Pick Locks'].effect.squirrel=\`squirrelActionEffect(onlyGetLoseSquirrel, onlyGetEmptySquirrel) {
		
		let actionEffect = () => {};
		let loseSquirrel = false;
		let nothingHappens = false;
		
		switch(getLevelSquirrelAction("Pick Locks")){
						
			case 1: loseSquirrel = true;
				break;
					
			case 2: actionEffect = () => {
						towns[BEGINNERSVILLE].finishRegular(this.varName, 10, () => {
							const manaGain = this.stolenGoodsGain() * this.goldCost();
							addMana(manaGain);
							return 0;
						});
					};
					break;
							
		}
		
		if(onlyGetLoseSquirrel){
			if(loseSquirrel) return true;
			return false;
		}
		
		if(onlyGetEmptySquirrel){
			if(String(actionEffect) === "() => {}" || nothingHappens === true) return true;
			return false;
		}
		
		if(loseSquirrel) addResource("squirrel", false);
		
		actionEffect();
	}\`;
creatorCache['Pick Locks'].effect.game=\`finish() {
		
		towns[BEGINNERSVILLE].finishRegular(this.varName, 10, () => {
			const goodsGain = this.stolenGoodsGain();
			addResource("stolenGoods", goodsGain);
			return goodsGain;
		});
        
    }\`;
creatorCache['Pick Locks'].effect.pred=\`(r,k,sq) => {
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
        }}\`;
creatorCache['Take Glasses']={};
creatorCache['Take Glasses'].affected=['stolenGoods'];
creatorCache['Take Glasses'].canStart={};
creatorCache['Take Glasses'].canStart.game=\`canStart() {
		const squirrelRequirements = (!this.squirrelAction || resources.squirrel);
		return squirrelRequirements && resources.stolenGoods >= 1;
    }\`;
creatorCache['Take Glasses'].canStart.pred=\`(input) => (input.stolenGoods >= 1)\`;
creatorCache['Take Glasses'].effect={};
creatorCache['Take Glasses'].effect.cost=\`cost() {
        addResource("stolenGoods", -1);
    }\`;
creatorCache['Take Glasses'].effect.squirrel=\`squirrelActionEffect(onlyGetLoseSquirrel, onlyGetEmptySquirrel) {
		
		let actionEffect = () => {};
		let loseSquirrel = false;
		let nothingHappens = false;
		
		switch(getLevelSquirrelAction("Take Glasses")){
						
			case 1: break;
												
		}
		
		if(onlyGetLoseSquirrel){
			if(loseSquirrel) return true;
			return false;
		}
		
		if(onlyGetEmptySquirrel){
			if(String(actionEffect) === "() => {}" || nothingHappens === true) return true;
			return false;
		}
		
		if(loseSquirrel) addResource("squirrel", false);
		
		actionEffect();
	}\`;
creatorCache['Take Glasses'].effect.game=\`finish() {
		
		addResource("glasses", true);
		unlockStory("glassesTaken");
        
    }\`;
creatorCache['Take Glasses'].effect.pred=\`(r,k,sq) => {
          if (!sq) r.glasses = true;
          r.stolenGoods-=1;
        }\`;
creatorCache['Found Glasses']={};
creatorCache['Found Glasses'].affected=[''];
creatorCache['Found Glasses'].canStart={};
creatorCache['Found Glasses'].canStart.game=\`canStart() {
        if(this.squirrelAction) return resources.squirrel;
		return true;
    }\`;
creatorCache['Found Glasses'].canStart.pred=\`\`;
creatorCache['Found Glasses'].effect={};
creatorCache['Found Glasses'].effect.game=\`finish() {
        addResource("glasses", true);
        unlockStory("glassesBought");
    }\`;
creatorCache['Found Glasses'].effect.pred=\`(r,k) => {
          r.glasses = true;
        }\`;
creatorCache['Buy Mana Z1']={};
creatorCache['Buy Mana Z1'].affected=['mana','gold','stolenGoods'];
creatorCache['Buy Mana Z1'].canStart={};
creatorCache['Buy Mana Z1'].canStart.game=\`canStart() {
		const squirrelRequirements = (!this.squirrelAction || resources.squirrel);
		return squirrelRequirements;
    }\`;
creatorCache['Buy Mana Z1'].canStart.pred=\`true\`;
creatorCache['Buy Mana Z1'].effect={};
creatorCache['Buy Mana Z1'].effect.squirrel=\`squirrelActionEffect(onlyGetLoseSquirrel, onlyGetEmptySquirrel) {
		
		let actionEffect = () => {};
		let loseSquirrel = false;
		let nothingHappens = false;
		
		switch(getLevelSquirrelAction("Buy Mana Z1")){
						
			case 1: actionEffect = () => {
						addResource("gold", resources.stolenGoods * this.stolenGoodsValue());
						addMana(resources.gold * this.goldCost());
						resetResource("stolenGoods");
						resetResource("gold");
						unlockStory("manaBoughtZ1");
					};
					break;
					
			case 2: actionEffect = () => {
						addResource("gold", resources.stolenGoods * this.stolenGoodsValue());
						addMana(resources.gold * this.goldCost());
						resetResource("stolenGoods");
						resetResource("gold");
						unlockStory("manaBoughtZ1");
						addMana(100);
					};
					loseSquirrel = true;		
				break;
			
			case 3: actionEffect = () => {
						addResource("gold", resources.stolenGoods * this.stolenGoodsValue());
						addMana(resources.gold * this.goldCost());
						resetResource("stolenGoods");
						resetResource("gold");
						unlockStory("manaBoughtZ1");
						addMana(1500);
					};
					loseSquirrel = true;
				break;
							
		}
		
		if(onlyGetLoseSquirrel){
			if(loseSquirrel) return true;
			return false;
		}
		
		if(onlyGetEmptySquirrel){
			if(String(actionEffect) === "() => {}" || nothingHappens === true) return true;
			return false;
		}
		
		if(loseSquirrel) addResource("squirrel", false);
		
		actionEffect();
	}\`;
creatorCache['Buy Mana Z1'].effect.game=\`finish() {
		
		addResource("gold", resources.stolenGoods * this.stolenGoodsValue());
		addMana(resources.gold * this.goldCost());
		resetResource("stolenGoods");
		resetResource("gold");
		unlockStory("manaBoughtZ1");
    }\`;
creatorCache['Buy Mana Z1'].effect.pred=\`(r,k, sq) => {
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
          
        }\`;
creatorCache['Meet People']={};
creatorCache['Meet People'].affected=[''];
creatorCache['Meet People'].canStart={};
creatorCache['Meet People'].canStart.game=\`canStart() {
		const squirrelRequirements = (!this.squirrelAction || resources.squirrel);
		return squirrelRequirements;
    }\`;
creatorCache['Meet People'].canStart.pred=\`true\`;
creatorCache['Meet People'].effect={};
creatorCache['Meet People'].effect.squirrel=\`squirrelActionEffect(onlyGetLoseSquirrel, onlyGetEmptySquirrel) {
		
		let actionEffect = () => {};
		let loseSquirrel = false;
		let nothingHappens = false;
		
		switch(getLevelSquirrelAction("Meet People")){
						
			case 1: break;
					
			case 2: break;	
							
		}
		
		if(onlyGetLoseSquirrel){
			if(loseSquirrel) return true;
			return false;
		}
		
		if(onlyGetEmptySquirrel){
			if(String(actionEffect) === "() => {}" || nothingHappens === true) return true;
			return false;
		}
		
		if(loseSquirrel) addResource("squirrel", false);
		
		actionEffect();
	}\`;
creatorCache['Meet People'].effect.game=\`finish() {
        
		towns[BEGINNERSVILLE].finishProgress(this.varName, 150);
		
    }\`;
creatorCache['Meet People'].effect.pred=\`\`;
creatorCache['Train Strength']={};
creatorCache['Train Strength'].affected=[''];
creatorCache['Train Strength'].canStart={};
creatorCache['Train Strength'].canStart.game=\`canStart() {
		const squirrelRequirements = (!this.squirrelAction || resources.squirrel);
		return squirrelRequirements;
    }\`;
creatorCache['Train Strength'].canStart.pred=\`true\`;
creatorCache['Train Strength'].effect={};
creatorCache['Train Strength'].effect.squirrel=\`squirrelActionEffect(onlyGetLoseSquirrel, onlyGetEmptySquirrel) {
		
		let actionEffect = () => {};
		let loseSquirrel = false;
		let nothingHappens = false;
		
		switch(getLevelSquirrelAction("Train Strength")){
						
				case 1: break;				
			}
		
		if(onlyGetLoseSquirrel){
			if(loseSquirrel) return true;
			return false;
		}
		
		if(onlyGetEmptySquirrel){
			if(String(actionEffect) === "() => {}" || nothingHappens === true) return true;
			return false;
		}
		
		if(loseSquirrel) addResource("squirrel", false);
		
		actionEffect();
	}\`;
creatorCache['Train Strength'].effect.game=\`finish() {
		unlockStory("strengthTrained");
    }\`;
creatorCache['Train Strength'].effect.pred=\`\`;
creatorCache['Short Quest']={};
creatorCache['Short Quest'].affected=['gold'];
creatorCache['Short Quest'].canStart={};
creatorCache['Short Quest'].canStart.game=\`canStart() {
		const squirrelRequirements = (!this.squirrelAction || resources.squirrel);
		return squirrelRequirements;
    }\`;
creatorCache['Short Quest'].canStart.pred=\`true\`;
creatorCache['Short Quest'].effect={};
creatorCache['Short Quest'].effect.squirrel=\`squirrelActionEffect(onlyGetLoseSquirrel, onlyGetEmptySquirrel) {
		
		let actionEffect = () => {};
		let loseSquirrel = false;
		let nothingHappens = false;
		
		switch(getLevelSquirrelAction("Short Quest")){
						
			case 1: break;		

			case 2: actionEffect = () => {
						towns[BEGINNERSVILLE].finishRegular(this.varName, 5, () => {
							const goldGain = this.goldCost();
							addResource("gold", goldGain);
							return goldGain;
						});
						if (towns[BEGINNERSVILLE]['good@{this.varName}'] >= 20 && towns[BEGINNERSVILLE]['goodTemp@{this.varName}'] <= towns[BEGINNERSVILLE]['good@{this.varName}'] - 20) unlockStory("maxSQuestsInALoop");
					};
					break;
				
			case 3: actionEffect = () => {
						towns[BEGINNERSVILLE].finishRegular(this.varName, 5, () => {
							const goldGain = this.goldCost() * 1.1;
							addResource("gold", goldGain);
							return goldGain;
						});
						if (towns[BEGINNERSVILLE]['good@{this.varName}'] >= 20 && towns[BEGINNERSVILLE]['goodTemp@{this.varName}'] <= towns[BEGINNERSVILLE]['good@{this.varName}'] - 20) unlockStory("maxSQuestsInALoop");
					};
					break;
		}
		if(onlyGetLoseSquirrel){
			if(loseSquirrel) return true;
			return false;
		}
		
		if(onlyGetEmptySquirrel){
			if(String(actionEffect) === "() => {}" || nothingHappens === true) return true;
			return false;
		}
		
		if(loseSquirrel) addResource("squirrel", false);
		
		actionEffect();
	}\`;
creatorCache['Short Quest'].effect.game=\`finish() {
        
		towns[BEGINNERSVILLE].finishRegular(this.varName, 5, () => {
			const goldGain = this.goldCost();
			addResource("gold", goldGain);
			return goldGain;
		});
		if (towns[BEGINNERSVILLE]['good@{this.varName}'] >= 20 && towns[BEGINNERSVILLE]['goodTemp@{this.varName}'] <= towns[BEGINNERSVILLE]['good@{this.varName}'] - 20) unlockStory("maxSQuestsInALoop");
    }\`;
creatorCache['Short Quest'].effect.pred=\`(r,k,sq) => {
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
        }\`;
creatorCache['Investigate']={};
creatorCache['Investigate'].affected=[''];
creatorCache['Investigate'].canStart={};
creatorCache['Investigate'].canStart.game=\`canStart() {
		const squirrelRequirements = (!this.squirrelAction || resources.squirrel);
		return squirrelRequirements;
    }\`;
creatorCache['Investigate'].canStart.pred=\`true\`;
creatorCache['Investigate'].effect={};
creatorCache['Investigate'].effect.squirrel=\`squirrelActionEffect(onlyGetLoseSquirrel, onlyGetEmptySquirrel) {
		
		let actionEffect = () => {};
		let loseSquirrel = false;
		let nothingHappens = false;
		
		switch(getLevelSquirrelAction("Investigate")){
						
			case 1: break;		

			case 2: actionEffect = () => {
						towns[BEGINNERSVILLE].finishProgress(this.varName, 400 * this.stolenGoodsMultiplication());
					};
					break;
				
		}
		
		if(onlyGetLoseSquirrel){
			if(loseSquirrel) return true;
			return false;
		}
		
		if(onlyGetEmptySquirrel){
			if(String(actionEffect) === "() => {}" || nothingHappens === true) return true;
			return false;
		}
		
		if(loseSquirrel) addResource("squirrel", false);
		
		actionEffect();
	}\`;
creatorCache['Investigate'].effect.game=\`finish() {
       
		towns[BEGINNERSVILLE].finishProgress(this.varName, 300 * this.stolenGoodsMultiplication());
		
    }\`;
creatorCache['Investigate'].effect.pred=\`\`;
creatorCache['Long Quest']={};
creatorCache['Long Quest'].affected=['gold','rep'];
creatorCache['Long Quest'].canStart={};
creatorCache['Long Quest'].canStart.game=\`canStart() {
		const squirrelRequirements = (!this.squirrelAction || resources.squirrel);
		return squirrelRequirements;
    }\`;
creatorCache['Long Quest'].canStart.pred=\`true\`;
creatorCache['Long Quest'].effect={};
creatorCache['Long Quest'].effect.squirrel=\`squirrelActionEffect(onlyGetLoseSquirrel, onlyGetEmptySquirrel) {
		
		let actionEffect = () => {};
		let loseSquirrel = false;
		let nothingHappens = false;
		
		switch(getLevelSquirrelAction("Long Quest")){
						
			case 1: break;		

			case 2:  actionEffect = () => {
						towns[BEGINNERSVILLE].finishRegular(this.varName, 5, () => {
							const goldGain = this.goldCost() * 1.1;
							addResource("gold", goldGain);
							return goldGain;
						});
						if (towns[BEGINNERSVILLE]['good@{this.varName}'] >= 10 && towns[BEGINNERSVILLE]['goodTemp@{this.varName}'] <= towns[BEGINNERSVILLE]['good@{this.varName}'] - 10) unlockStory("maxLQuestsInALoop");
					};
					break;
				
			case 3: actionEffect = () => {
						towns[BEGINNERSVILLE].finishRegular(this.varName, 5, () => {
							addResource("reputation", 1);
							const goldGain = this.goldCost() * 1.2;
							addResource("gold", goldGain);
							return goldGain;
						});
						if (towns[BEGINNERSVILLE]['good@{this.varName}'] >= 10 && towns[BEGINNERSVILLE]['goodTemp@{this.varName}'] <= towns[BEGINNERSVILLE]['good@{this.varName}'] - 10) unlockStory("maxLQuestsInALoop");
					};
					break;
				
		}
		
		if(onlyGetLoseSquirrel){
			if(loseSquirrel) return true;
			return false;
		}
		
		if(onlyGetEmptySquirrel){
			if(String(actionEffect) === "() => {}" || nothingHappens === true) return true;
			return false;
		}
		
		if(loseSquirrel) addResource("squirrel", false);
		
		actionEffect();
	}\`;
creatorCache['Long Quest'].effect.game=\`finish() {
		
		 towns[BEGINNERSVILLE].finishRegular(this.varName, 5, () => {
			addResource("reputation", 1);
			const goldGain = this.goldCost();
			addResource("gold", goldGain);
			return goldGain;
		});
		if (towns[BEGINNERSVILLE]['good@{this.varName}'] >= 10 && towns[BEGINNERSVILLE]['goodTemp@{this.varName}'] <= towns[BEGINNERSVILLE]['good@{this.varName}'] - 10) unlockStory("maxLQuestsInALoop");
       
    }\`;
creatorCache['Long Quest'].effect.pred=\`(r,k,sq) => {
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
        }\`;
creatorCache['Throw Party']={};
creatorCache['Throw Party'].affected=['rep'];
creatorCache['Throw Party'].canStart={};
creatorCache['Throw Party'].canStart.game=\`canStart() {
		const squirrelRequirements = (!this.squirrelAction || resources.squirrel);
		return squirrelRequirements && resources.reputation >= 2;
    }\`;
creatorCache['Throw Party'].canStart.pred=\`(input)=>(input.rep>=2)\`;
creatorCache['Throw Party'].effect={};
creatorCache['Throw Party'].effect.cost=\`cost() {
        addResource("reputation", -2);
    }\`;
creatorCache['Throw Party'].effect.squirrel=\`squirrelActionEffect(onlyGetLoseSquirrel, onlyGetEmptySquirrel) {
		
		let actionEffect = () => {};
		let loseSquirrel = false;
		let nothingHappens = false;
		
		switch(getLevelSquirrelAction("Throw Party")){
						
			case 1: actionEffect = () => {
						towns[BEGINNERSVILLE].finishProgress("Met", 2700);
						unlockStory("partyThrown");
					};
					break;		

			case 2: actionEffect = () => {
						adjustSQuests();
						adjustLQuests();
						towns[BEGINNERSVILLE].finishProgress("Met", 2700);
						view.updateRegular("SQuests", BEGINNERSVILLE);
						view.updateRegular("LQuests", BEGINNERSVILLE);
					};
					break;
				
		}
		
		if(onlyGetLoseSquirrel){
			if(loseSquirrel) return true;
			return false;
		}
		
		if(onlyGetEmptySquirrel){
			if(String(actionEffect) === "() => {}" || nothingHappens === true) return true;
			return false;
		}
		
		if(loseSquirrel) addResource("squirrel", false);
		
		actionEffect();
	}\`;
creatorCache['Throw Party'].effect.game=\`finish() {
		
		towns[BEGINNERSVILLE].finishProgress("Met", 2100);
		unlockStory("partyThrown");
        
    }\`;
creatorCache['Throw Party'].effect.pred=\`(r,k,sq)=>{
            r.rep-=2;
          }\`;
creatorCache['Warrior Lessons']={};
creatorCache['Warrior Lessons'].affected=[''];
creatorCache['Warrior Lessons'].canStart={};
creatorCache['Warrior Lessons'].canStart.game=\`canStart() {
		const squirrelRequirements = (!this.squirrelAction || resources.squirrel);
		return squirrelRequirements && resources.reputation >= 2;
    }\`;
creatorCache['Warrior Lessons'].canStart.pred=\`(input) => input.rep >= 2\`;
creatorCache['Warrior Lessons'].effect={};
creatorCache['Warrior Lessons'].effect.skills={};	
creatorCache['Warrior Lessons'].effect.skills.Combat=100,
creatorCache['Warrior Lessons'].effect.squirrel=\`squirrelActionEffect(onlyGetLoseSquirrel, onlyGetEmptySquirrel) {
		
		let actionEffect = () => {};
		let loseSquirrel = false;
		let nothingHappens = false;
		
		switch(getLevelSquirrelAction("Warrior Lessons")){
						
			case 1:  break;		

			case 2: actionEffect = () => {
						handleSkillExp(this.skills);
						handleSkillExp(this.skills);
						handleSkillExp(this.skills);
					};
					loseSquirrel = true;
					break;
				
			case 3: actionEffect = () => {
						for(let i = 0; i < 10; i++){
							handleSkillExp(this.skills);
						}
					};
					loseSquirrel = true;
					break;
				
		}
		
		if(onlyGetLoseSquirrel){
			if(loseSquirrel) return true;
			return false;
		}
		
		if(onlyGetEmptySquirrel){
			if(String(actionEffect) === "() => {}" || nothingHappens === true) return true;
			return false;
		}
		
		if(loseSquirrel) addResource("squirrel", false);
		
		actionEffect();
	}\`;
creatorCache['Warrior Lessons'].effect.game=\`finish() {
		
		handleSkillExp(this.skills);
        
    }\`;
creatorCache['Warrior Lessons'].effect.pred=\`(r, k, sq) => {
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
        }\`;
creatorCache['Mage Lessons']={};
creatorCache['Mage Lessons'].affected=[''];
creatorCache['Mage Lessons'].canStart={};
creatorCache['Mage Lessons'].canStart.game=\`canStart() {
		const squirrelRequirements = (!this.squirrelAction || resources.squirrel);
		return squirrelRequirements && resources.reputation >= 2;
    }\`;
creatorCache['Mage Lessons'].canStart.pred=\`(input) => input.rep >= 2\`;
creatorCache['Mage Lessons'].effect={};
creatorCache['Mage Lessons'].effect.skills={};	
creatorCache['Mage Lessons'].effect.skills.Magic=100,
creatorCache['Mage Lessons'].effect.squirrel=\`squirrelActionEffect(onlyGetLoseSquirrel, onlyGetEmptySquirrel) {
		
		let actionEffect = () => {};
		let loseSquirrel = false;
		let nothingHappens = false;
		
		switch(getLevelSquirrelAction("Mage Lessons")){
						
			case 1:  break;		

			case 2: actionEffect = () => {
						handleSkillExp(this.skills);
						handleSkillExp(this.skills);
						handleSkillExp(this.skills);
					};
					loseSquirrel = true;
				break;
				
			case 3: actionEffect = () => {
						for(let i = 0; i < 10; i++){
							handleSkillExp(this.skills);
						}
					};
					loseSquirrel = true;
				break;
				
		}
		
		if(onlyGetLoseSquirrel){
			if(loseSquirrel) return true;
			return false;
		}
		
		if(onlyGetEmptySquirrel){
			if(String(actionEffect) === "() => {}" || nothingHappens === true) return true;
			return false;
		}
		
		if(loseSquirrel) addResource("squirrel", false);
		
		actionEffect();
	}\`;
creatorCache['Mage Lessons'].effect.game=\`finish() {
		handleSkillExp(this.skills);
    }\`;
creatorCache['Mage Lessons'].effect.pred=\`(r, k, sq) => { 
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
        }\`;
creatorCache['Heal The Sick']={};
creatorCache['Heal The Sick'].affected=['rep'];
creatorCache['Heal The Sick'].canStart={};
creatorCache['Heal The Sick'].canStart.game=\`canStart() {
		const squirrelRequirements = (!this.squirrelAction || (resources.squirrel && !alreadyHealed ));
		return squirrelRequirements && resources.reputation >= 1;
    }\`;
creatorCache['Heal The Sick'].canStart.pred=\`(input,sq) => {
      if (sq) {
        if (input.alreadyHealed) return false;
      }
      return input.rep >= 1;
    }\`;
creatorCache['Heal The Sick'].loop={};
creatorCache['Heal The Sick'].loop.cost={};
creatorCache['Heal The Sick'].loop.cost.game=\`loopCost(segment) {
        return fibonacci(2 + Math.floor((towns[BEGINNERSVILLE].HealLoopCounter + segment) / this.segments + 0.0000001)) * 10000;
    }\`;
creatorCache['Heal The Sick'].loop.cost.pred=\`(p, a) => segment =>  fibonacci(2 + Math.floor((p.completed + segment) / a.segments + .0000001)) * 10000\`;
creatorCache['Heal The Sick'].loop.tick={};
creatorCache['Heal The Sick'].loop.tick.game=\`tickProgress(offset) {
		if(this.squirrelAction){
			let squirrelMult = 0;
			if(getLevelSquirrelAction("Heal The Sick") == 2){
				squirrelMult = 1;
			} else if (getLevelSquirrelAction("Heal The Sick") >= 3){
				squirrelMult = 2;
			}
			
			return squirrelMult * this.loopCost(offset) * 3 / this.manaCost();			
			
		}
        return getSkillLevel("Magic") * Math.max(getSkillLevel("Restoration") / 50, 1) * (1 + getLevel(this.loopStats[(towns[BEGINNERSVILLE].HealLoopCounter + offset) % this.loopStats.length]) / 100) * Math.sqrt(1 + towns[BEGINNERSVILLE].totalHeal / 100);
    }\`;
creatorCache['Heal The Sick'].loop.tick.pred=\`(p, a, s, k, r, sq, lCost) => offset =>  sq ?  Math.max(getLevelSquirrelAction("Heal The Sick")-1,0) * lCost(offset) * 3 / a.manaCost() : getSkillLevelFromExp(k.magic) * Math.max( getSkillLevelFromExp(k.restoration) / 50, 1) * h.getStatProgress(p, a, s, offset, 100) * Math.sqrt(1 + p.total / 100)\`;
creatorCache['Heal The Sick'].loop.end={};
creatorCache['Heal The Sick'].loop.end.skills={};	
creatorCache['Heal The Sick'].loop.end.skills.Magic=50,
creatorCache['Heal The Sick'].loop.end.squirrel=\`squirrelActionEffect(onlyGetLoseSquirrel, onlyGetEmptySquirrel) {
		
		let actionEffect = () => {};
		let loseSquirrel = false;
		let nothingHappens = false;
		
		switch(getLevelSquirrelAction("Heal The Sick")){
						
			case 1:  break;
			
			case 2: actionEffect = () => {
						alreadyHealed = true;
					};
					break;
			
			case 3: actionEffect = () => {
						alreadyHealed = true;
					};
					break;
					
		}
		if(onlyGetLoseSquirrel){
			if(loseSquirrel) return true;
			return false;
		}
		
		if(onlyGetEmptySquirrel){
			if(String(actionEffect) === "() => {}" || nothingHappens === true) return true;
			return false;
		}
		
		if(loseSquirrel) addResource("squirrel", false);
		
		actionEffect();
	}\`;
creatorCache['Heal The Sick'].loop.end.game=\`finish() {
		
		if (towns[BEGINNERSVILLE].HealLoopCounter / 3 + 1 >= 10) unlockStory("heal10PatientsInALoop");
        
    }\`;
creatorCache['Heal The Sick'].loop.end.pred=\`(r,k,sq)=>{if (sq) r.alreadyHealed=true;}\`;
creatorCache['Heal The Sick'].loop.loop={};
creatorCache['Heal The Sick'].loop.loop.game=\`loopsFinished() {
        addResource("reputation", 3);
		handleSkillExp(this.skills);
		if(this.squirrelAction){
			handleSkillExp(this.skills);
			handleSkillExp(this.skills);
		}
    }\`;
creatorCache['Heal The Sick'].loop.loop.pred=\`(r,k,sq) => {r.rep += 3; k.magic+=(sq?150:50);}\`;
creatorCache['Heal The Sick'].loop.max=\`\`;
creatorCache['Fight Monsters']={};
creatorCache['Fight Monsters'].affected=['gold'];
creatorCache['Fight Monsters'].canStart={};
creatorCache['Fight Monsters'].canStart.game=\`canStart() {
		const squirrelRequirements = (!this.squirrelAction || (resources.squirrel && !alreadyFought ));
		return squirrelRequirements && resources.reputation >= 2;
    }\`;
creatorCache['Fight Monsters'].canStart.pred=\`(input,sq) => {
      if (sq) {
        if (input.alreadyFought) return false;
      }
      return input.rep >= 2;
    }\`;
creatorCache['Fight Monsters'].loop={};
creatorCache['Fight Monsters'].loop.cost={};
creatorCache['Fight Monsters'].loop.cost.game=\`loopCost(segment) {
        return fibonacci(Math.floor((towns[BEGINNERSVILLE].FightLoopCounter + segment) - towns[BEGINNERSVILLE].FightLoopCounter / 3 + 0.0000001)) * 20000;
    }\`;
creatorCache['Fight Monsters'].loop.cost.pred=\`(p, a) => segment =>  fibonacci(Math.floor((p.completed + segment) - p.completed / a.segments + .0000001)) * 20000\`;
creatorCache['Fight Monsters'].loop.tick={};
creatorCache['Fight Monsters'].loop.tick.game=\`tickProgress(offset) {
		
		if(this.squirrelAction){
			let squirrelMult = 0;
			if(getLevelSquirrelAction("Fight Monsters") == 2){
				squirrelMult = 1;
			} else if (getLevelSquirrelAction("Fight Monsters") >= 3){
				squirrelMult = 2;
			}
			
			return squirrelMult * this.loopCost(offset) * 3 / this.manaCost();			
			
		}
		
        return getSelfCombat() * (1 + getLevel(this.loopStats[(towns[BEGINNERSVILLE].FightLoopCounter + offset) % this.loopStats.length]) / 100) * Math.sqrt(1 + towns[BEGINNERSVILLE].totalFight / 100);
    }\`;
creatorCache['Fight Monsters'].loop.tick.pred=\`(p, a, s, k, r, sq, lCost) => offset => sq ? Math.max(getLevelSquirrelAction("Fight Monsters")-1,0) * lCost(offset) * 3 / a.manaCost() : h.getSelfCombat(r, k) * Math.sqrt(1 + p.total / 100) * h.getStatProgress(p, a, s, offset, 100)\`;
creatorCache['Fight Monsters'].loop.end={};
creatorCache['Fight Monsters'].loop.end.skills={};	
creatorCache['Fight Monsters'].loop.end.skills.Combat=50,
creatorCache['Fight Monsters'].loop.end.squirrel=\`squirrelActionEffect(onlyGetLoseSquirrel, onlyGetEmptySquirrel) {
		
		let actionEffect = () => {};
		let loseSquirrel = false;
		let nothingHappens = false;
		
		switch(getLevelSquirrelAction("Fight Monsters")){
						
			case 1: loseSquirrel = true;
				break;
				
			case 2: actionEffect = () => {
						alreadyFought = true;
					};
					break;
			
			case 3: actionEffect = () => {
						alreadyFought = true;
					};
					break;
				
		}
		
		if(onlyGetLoseSquirrel){
			if(loseSquirrel) return true;
			return false;
		}
		
		if(onlyGetEmptySquirrel){
			if(String(actionEffect) === "() => {}" || nothingHappens === true) return true;
			return false;
		}
		
		if(loseSquirrel) addResource("squirrel", false);
		
		actionEffect();
	}\`;
creatorCache['Fight Monsters'].loop.end.game=\`finish() {
		
    }\`;
creatorCache['Fight Monsters'].loop.end.pred=\`(r, k, sq) => {
          if (sq) {
            if (getLevelSquirrelAction("Fight Monsters")<2) {
              h.killSquirrel(r);
            } else {
              r.alreadyFought=true;
            }
          }
        }\`;
creatorCache['Fight Monsters'].loop.segment={};
creatorCache['Fight Monsters'].loop.segment.game=\`segmentFinished() {
        addResource("gold", 20);
		handleSkillExp(this.skills);
    }\`;
creatorCache['Fight Monsters'].loop.segment.pred=\`(r,k) => (r.gold += 20,k.combat += 50*(1+getBuffLevel("Heroism") * 0.02))\`;
creatorCache['Fight Monsters'].loop.loop={};
creatorCache['Fight Monsters'].loop.loop.game=\`loopsFinished() {
        // empty
    }\`;
creatorCache['Fight Monsters'].loop.loop.pred=\`\`;
creatorCache['Fight Monsters'].loop.max=\`\`;
creatorCache['Training Dummy']={};
creatorCache['Training Dummy'].affected=['magicFight'];
creatorCache['Training Dummy'].canStart={};
creatorCache['Training Dummy'].canStart.game=\`canStart() {
		const squirrelRequirements = (!this.squirrelAction || resources.squirrel);
		const curPowerLevel = Math.floor((towns[BEGINNERSVILLE].TDummyLoopCounter) / 9 + 0.0000001);
		
		return squirrelRequirements && resources.reputation >= 2 && curPowerLevel < 3;
    }\`;
creatorCache['Training Dummy'].canStart.pred=\`(input,sq) => {
			return ((!sq || input.squirrel) && input.rep >= 2);
        }\`;
creatorCache['Training Dummy'].loop={};
creatorCache['Training Dummy'].loop.cost={};
creatorCache['Training Dummy'].loop.cost.game=\`loopCost(segment) {
        return precision3((Math.floor(Math.pow(3, towns[BEGINNERSVILLE].TDummyLoopCounter/this.segments)+ 0.0000001)) * 60000);
		
    }\`;
creatorCache['Training Dummy'].loop.cost.pred=\`(p) => segment =>  precision3(Math.floor(Math.pow(3, p.completed/9)+0.0000001)*60000)\`;
creatorCache['Training Dummy'].loop.tick={};
creatorCache['Training Dummy'].loop.tick.game=\`tickProgress(offset) {
		if(this.squirrelAction) return 0;
        return (getSelfCombat() + getSkillLevel("Magic")) * Math.sqrt(1 + towns[BEGINNERSVILLE].totalTDummy / 100) * (1 + getLevel(this.loopStats[(towns[BEGINNERSVILLE].TDummyLoopCounter + offset) % this.loopStats.length]) / 100) ; 
		
    }\`;
creatorCache['Training Dummy'].loop.tick.pred=\`(p, a, s, k, r, sq) => offset => {
            let floor = Math.floor(p.completed / a.segments + .0000001);
            if (sq) {
               return  0;//Math.max((getLevelSquirrelAction("Small Dungeon")-1),0)/2 * lCost(offset) * 7 / a.manaCost();
            }
            if (floor>=3) return 0;
            return (h.getSelfCombat(r, k) +  getSkillLevelFromExp(k.magic)) * h.getStatProgress(p, a, s, offset, 100) *  Math.sqrt(1 + towns[BEGINNERSVILLE].totalTDummy / 100);
    }\`;
creatorCache['Training Dummy'].loop.end={};
creatorCache['Training Dummy'].loop.end.skills={};	
creatorCache['Training Dummy'].loop.end.skills.Combat=25,	
creatorCache['Training Dummy'].loop.end.skills.Magic=25,
creatorCache['Training Dummy'].loop.end.squirrel=\`squirrelActionEffect(onlyGetLoseSquirrel, onlyGetEmptySquirrel) {
		
		let actionEffect = () => {};
		let loseSquirrel = false;
		let nothingHappens = false;
		
		switch(getLevelSquirrelAction("Training Dummy")){
					
			case 1: break;
				
		}
		
		if(onlyGetLoseSquirrel){
			if(loseSquirrel) return true;
			return false;
		}
		
		if(onlyGetEmptySquirrel){
			if(String(actionEffect) === "() => {}" || nothingHappens === true) return true;
			return false;
		}
		
		if(loseSquirrel) addResource("squirrel", false);
		
		actionEffect();
	}\`;
creatorCache['Training Dummy'].loop.end.game=\`finish() {
	
		const curPowerLevel = Math.floor((towns[BEGINNERSVILLE].TDummyLoopCounter) / 9 + 0.0000001);
		if(curPowerLevel === 3 && magicFighterStrenght === 0){
			magicFight = true;
		}
		
    }\`;
creatorCache['Training Dummy'].loop.end.pred=\`(r,k) => {
      if(r.trainLoop>=3) r.magicFight=1;
    }\`;
creatorCache['Training Dummy'].loop.segment={};
creatorCache['Training Dummy'].loop.segment.game=\`segmentFinished() {
		handleSkillExp(this.skills);
    }\`;
creatorCache['Training Dummy'].loop.segment.pred=\`(r,k) => {
      k.combat+=25;
      k.magic+=25;
    }\`;
creatorCache['Training Dummy'].loop.loop={};
creatorCache['Training Dummy'].loop.loop.game=\`loopsFinished() {
		handleSkillExp(this.skills);
    }\`;
creatorCache['Training Dummy'].loop.loop.pred=\`(r,k) => {
      k.combat+=25;
      k.magic+=25;
      r.trainLoop=(r.trainLoop||0)+1;
    }\`;
creatorCache['Training Dummy'].loop.max=\`()=>3\`;
creatorCache['Magic Fighter']={};
creatorCache['Magic Fighter'].affected=['magicFight'];
creatorCache['Magic Fighter'].canStart={};
creatorCache['Magic Fighter'].canStart.game=\`canStart() {
		const squirrelRequirements = (!this.squirrelAction || resources.squirrel);
		const curPowerLevel = Math.floor((towns[BEGINNERSVILLE].MagFgtLoopCounter) / 9 + 0.0000001);
		
		return squirrelRequirements && resources.reputation >= 2 && curPowerLevel < magicFighterStrenght;
    }\`;
creatorCache['Magic Fighter'].canStart.pred=\`(input) => {
          return input.rep>=2;
        }\`;
creatorCache['Magic Fighter'].loop={};
creatorCache['Magic Fighter'].loop.cost={};
creatorCache['Magic Fighter'].loop.cost.game=\`loopCost(segment) {
        return precision3((Math.floor(Math.pow(5, towns[BEGINNERSVILLE].MagFgtLoopCounter/this.segments)+ 0.0000001)) * 500000);
		
    }\`;
creatorCache['Magic Fighter'].loop.cost.pred=\`(p) => segment =>  precision3(Math.floor(Math.pow(5, p.completed/9)+ 0.0000001)*500000)\`;
creatorCache['Magic Fighter'].loop.tick={};
creatorCache['Magic Fighter'].loop.tick.game=\`tickProgress(offset) {
		if(this.squirrelAction) return 0;
        return (getSelfCombat() + getSkillLevel("Magic")) * Math.sqrt(1 + towns[BEGINNERSVILLE].totalMagFgt / 200) * (1 + getLevel(this.loopStats[(towns[BEGINNERSVILLE].MagFgtLoopCounter + offset) % this.loopStats.length]) / 200) ; 
		
    }\`;
creatorCache['Magic Fighter'].loop.tick.pred=\`(p, a, s, k, r, sq) => offset => sq ? 0 : (h.getSelfCombat(r, k) +  getSkillLevelFromExp(k.magic)) * h.getStatProgress(p, a, s, offset, 200) * Math.sqrt(1 + p.total / 200)\`;
creatorCache['Magic Fighter'].loop.end={};
creatorCache['Magic Fighter'].loop.end.skills={};	
creatorCache['Magic Fighter'].loop.end.skills.Combat=75,	
creatorCache['Magic Fighter'].loop.end.skills.Magic=75,
creatorCache['Magic Fighter'].loop.end.squirrel=\`squirrelActionEffect(onlyGetLoseSquirrel, onlyGetEmptySquirrel) {
		
		let actionEffect = () => {};
		let loseSquirrel = false;
		let nothingHappens = false;
		
		switch(getLevelSquirrelAction("Magic Fighter")){
					
			case 1: break;
			
			case 2: break;
				
		}
		
		if(onlyGetLoseSquirrel){
			if(loseSquirrel) return true;
			return false;
		}
		
		if(onlyGetEmptySquirrel){
			if(String(actionEffect) === "() => {}" || nothingHappens === true) return true;
			return false;
		}
		
		if(loseSquirrel) addResource("squirrel", false);
		
		actionEffect();
	}\`;
creatorCache['Magic Fighter'].loop.end.game=\`finish() {
		const curPowerLevel = Math.floor((towns[BEGINNERSVILLE].MagFgtLoopCounter) / 9 + 0.0000001);
		if(curPowerLevel === magicFighterStrenght){
			magicFight = true;
		}
    }\`;
creatorCache['Magic Fighter'].loop.end.pred=\`(r,k)=> {
       if (r.magicLoop>=magicFighterStrenght) r.magicFight=1;
    }\`;
creatorCache['Magic Fighter'].loop.segment={};
creatorCache['Magic Fighter'].loop.segment.game=\`segmentFinished() {
		handleSkillExp(this.skills);
    }\`;
creatorCache['Magic Fighter'].loop.segment.pred=\`(r,k) => {k.combat += 75; k.magic += 75;}\`;
creatorCache['Magic Fighter'].loop.loop={};
creatorCache['Magic Fighter'].loop.loop.game=\`loopsFinished() {
		handleSkillExp(this.skills);
    }\`;
creatorCache['Magic Fighter'].loop.loop.pred=\`(r,k) => {k.combat += 75; k.magic += 75;r.magicLoop=(r.magicLoop||0)+1;}\`;
creatorCache['Magic Fighter'].loop.max=\`()=>magicFighterStrenght\`;
creatorCache['Small Dungeon']={};
creatorCache['Small Dungeon'].affected=['soul'];
creatorCache['Small Dungeon'].canStart={};
creatorCache['Small Dungeon'].canStart.game=\`canStart() {
		const squirrelRequirements = (!this.squirrelAction || (resources.squirrel && alreadySDungeon === false));
		const curFloor = Math.floor((towns[this.townNum].SDungeonLoopCounter) / this.segments + 0.0000001);
		
		return squirrelRequirements && resources.reputation >= 2 && curFloor < dungeons[this.dungeonNum].length;
    }\`;
creatorCache['Small Dungeon'].canStart.pred=\`(input,sq) => {
      if (sq) {
        if (input.alreadySDungeon) return false;
      }
      return input.rep >= 2;
    }\`;
creatorCache['Small Dungeon'].loop={};
creatorCache['Small Dungeon'].loop.cost={};
creatorCache['Small Dungeon'].loop.cost.game=\`loopCost(segment) {
        return precision3(Math.pow(2.5, Math.floor((towns[this.townNum].SDungeonLoopCounter + segment) / this.segments + 0.0000001)) * 30000);
    }\`;
creatorCache['Small Dungeon'].loop.cost.pred=\`(p, a) => segment =>  precision3(Math.pow(2.5, Math.floor((p.completed + segment) / a.segments + .0000001)) * 30000)\`;
creatorCache['Small Dungeon'].loop.tick={};
creatorCache['Small Dungeon'].loop.tick.game=\`tickProgress(offset) {
		
		if(this.squirrelAction){
			let squirrelMult = 0;
			if(getLevelSquirrelAction("Small Dungeon") == 2){
				squirrelMult = 0.5;
			} else if (getLevelSquirrelAction("Small Dungeon") >= 3){
				squirrelMult = 1;
			}
			
			return squirrelMult * this.loopCost(offset) * 7 / this.manaCost();			
			
		}
		
        const floor = Math.floor((towns[this.townNum].SDungeonLoopCounter) / this.segments + 0.0000001);
        return (getSelfCombat() + getSkillLevel("Magic")) *
            (1 + getLevel(this.loopStats[(towns[this.townNum].SDungeonLoopCounter + offset) % this.loopStats.length]) / 100) *
            Math.sqrt(1 + dungeons[this.dungeonNum][floor].completed / 200);
    }\`;
creatorCache['Small Dungeon'].loop.tick.pred=\`(p, a, s, k, r, sq, lCost) => offset => {
            let floor = Math.floor(p.completed / a.segments + .0000001);
            if (sq) {
               return  Math.max((getLevelSquirrelAction("Small Dungeon")-1),0)/2 * lCost(offset) * 7 / a.manaCost();
            }
            return floor in  dungeons[a.dungeonNum] ? (h.getSelfCombat(r, k) +  getSkillLevelFromExp(k.magic)) * h.getStatProgress(p, a, s, offset, 100) * Math.sqrt(1 +  dungeons[a.dungeonNum][floor].completed / 200) : 0;
          }\`;
creatorCache['Small Dungeon'].loop.end={};
creatorCache['Small Dungeon'].loop.end.skills={};	
creatorCache['Small Dungeon'].loop.end.skills.Combat=100,	
creatorCache['Small Dungeon'].loop.end.skills.Magic=100,
creatorCache['Small Dungeon'].loop.end.squirrel=\`squirrelActionEffect(onlyGetLoseSquirrel, onlyGetEmptySquirrel) {
		
		let actionEffect = () => {};
		let loseSquirrel = false;
		let nothingHappens = false;
		
		switch(getLevelSquirrelAction("Small Dungeon")){
						
			case 1: break;
			
			case 2: actionEffect = () => {
						alreadySDungeon = true;
						unlockStory("smallDungeonAttempted");
						if (towns[BEGINNERSVILLE].SDungeonLoopCounter >= 42) unlockStory("clearSDungeon");
					};
					break;
			
			case 3: actionEffect = () => {
						alreadySDungeon = true;
						unlockStory("smallDungeonAttempted");
						if (towns[BEGINNERSVILLE].SDungeonLoopCounter >= 42) unlockStory("clearSDungeon");
					};
					break;
		}
		
		if(onlyGetLoseSquirrel){
			if(loseSquirrel) return true;
			return false;
		}
		
		if(onlyGetEmptySquirrel){
			if(String(actionEffect) === "() => {}" || nothingHappens === true) return true;
			return false;
		}
		
		if(loseSquirrel) addResource("squirrel", false);
		
		actionEffect();
	}\`;
creatorCache['Small Dungeon'].loop.end.game=\`finish() {
        
		unlockStory("smallDungeonAttempted");
		if (towns[BEGINNERSVILLE].SDungeonLoopCounter >= 42) unlockStory("clearSDungeon");
		
    }\`;
creatorCache['Small Dungeon'].loop.end.pred=\`(r,k,sq)=>{if (sq) r.alreadySDungeon=true;}\`;
creatorCache['Small Dungeon'].loop.loop={};
creatorCache['Small Dungeon'].loop.loop.game=\`loopsFinished() {
        const curFloor = Math.floor((towns[this.townNum].SDungeonLoopCounter) / this.segments + 0.0000001 - 1);
        const success = finishDungeon(this.dungeonNum, curFloor);
        if (success === true && storyMax <= 1) {
            unlockGlobalStory(1);
        } else if (success === false && storyMax <= 2) {
            unlockGlobalStory(2);
        }
		handleSkillExp(this.skills);
    }\`;
creatorCache['Small Dungeon'].loop.loop.pred=\`(r,k) => {r.soul+=h.getRewardSS(0);k.combat += 100*(1+getBuffLevel("Heroism") * 0.02); k.magic += 100;}\`;
creatorCache['Small Dungeon'].loop.max=\`(a) =>  dungeons[a.dungeonNum].length\`;
creatorCache['Buy Supplies']={};
creatorCache['Buy Supplies'].affected=['gold'];
creatorCache['Buy Supplies'].canStart={};
creatorCache['Buy Supplies'].canStart.game=\`canStart() {
		const squirrelRequirements = (!this.squirrelAction || resources.squirrel);
		return squirrelRequirements && resources.gold >= towns[BEGINNERSVILLE].suppliesCost;
    }\`;
creatorCache['Buy Supplies'].canStart.pred=\`(input,sq) => sq || (input.gold >= 450 - Math.max((input.supplyDiscount || 0) * 30, 0))\`;
creatorCache['Buy Supplies'].effect={};
creatorCache['Buy Supplies'].effect.cost=\`cost() {
        addResource("gold", -towns[BEGINNERSVILLE].suppliesCost);
    }\`;
creatorCache['Buy Supplies'].effect.squirrel=\`squirrelActionEffect(onlyGetLoseSquirrel, onlyGetEmptySquirrel) {
		
		let actionEffect = () => {};
		let loseSquirrel = false;
		let nothingHappens = false;
		
		switch(getLevelSquirrelAction("Buy Supplies")){
						
			case 1: actionEffect = () => {
						addResource("gold", towns[BEGINNERSVILLE].suppliesCost);
					};
					nothingHappens = true;
					break;
				
		}
		
		if(onlyGetLoseSquirrel){
			if(loseSquirrel) return true;
			return false;
		}
		
		if(onlyGetEmptySquirrel){
			if(String(actionEffect) === "() => {}" || nothingHappens === true) return true;
			return false;
		}
		
		if(loseSquirrel) addResource("squirrel", false);
		
		actionEffect();
	}\`;
creatorCache['Buy Supplies'].effect.game=\`finish() {
        
		addResource("supplies", true);
		if (towns[BEGINNERSVILLE].suppliesCost === 450) unlockStory("suppliesBoughtWithoutHaggling");
		unlockStory("suppliesBought");
    }\`;
creatorCache['Buy Supplies'].effect.pred=\`(r,k,sq) => {
            if (sq) return;
            r.gold -= 450 - Math.max((r.supplyDiscount || 0) * 30, 0);
            r.supplies = (r.supplies || 0) + 1;
          }\`;
creatorCache['Haggle']={};
creatorCache['Haggle'].affected=['rep'];
creatorCache['Haggle'].canStart={};
creatorCache['Haggle'].canStart.game=\`canStart() {
		const squirrelRequirements = (!this.squirrelAction || resources.squirrel);
		return squirrelRequirements && resources.reputation >= 1; 
    }\`;
creatorCache['Haggle'].canStart.pred=\`(input, sq) => sq ? !input.squirrelHaggle:(input.rep > 0)\`;
creatorCache['Haggle'].effect={};
creatorCache['Haggle'].effect.cost=\`cost() {
        addResource("reputation", -1);
    }\`;
creatorCache['Haggle'].effect.squirrel=\`squirrelActionEffect(onlyGetLoseSquirrel, onlyGetEmptySquirrel) {
		
		let actionEffect = () => {};
		let loseSquirrel = false;
		let nothingHappens = false;
		
		switch(getLevelSquirrelAction("Haggle")){
						
			case 1: break;
			
			case 2: actionEffect = () => {
						if(!squirrelHaggle){
							towns[BEGINNERSVILLE].suppliesCost -= 30;
							if (towns[BEGINNERSVILLE].suppliesCost < 0) {
								towns[BEGINNERSVILLE].suppliesCost = 0;
							}
							view.adjustGoldCost("BuySupplies", towns[BEGINNERSVILLE].suppliesCost);
							squirrelHaggle = true;
							addResource("reputation", 1);
						}
					};
					break;
				
		}
		
		if(onlyGetLoseSquirrel){
			if(loseSquirrel) return true;
			return false;
		}
		
		if(onlyGetEmptySquirrel){
			if(String(actionEffect) === "() => {}" || nothingHappens === true) return true;
			return false;
		}
		
		if(loseSquirrel) addResource("squirrel", false);
		
		actionEffect();
	}\`;
creatorCache['Haggle'].effect.game=\`finish() {
		
		if (towns[BEGINNERSVILLE].suppliesCost === 30) unlockStory("haggle15TimesInALoop");
		else if (towns[BEGINNERSVILLE].suppliesCost === 0) unlockStory("haggle16TimesInALoop");
		towns[BEGINNERSVILLE].suppliesCost -= 30;
		if (towns[BEGINNERSVILLE].suppliesCost < 0) {
			towns[BEGINNERSVILLE].suppliesCost = 0;
		}
		view.adjustGoldCost("BuySupplies", towns[BEGINNERSVILLE].suppliesCost);
		unlockStory("haggle");
    }\`;
creatorCache['Haggle'].effect.pred=\`(r,k,sq) => {
          if (sq) {
            if (getLevelSquirrelAction("Haggle")<2) return;
            r.squirrelHaggle=true;
          } else {
            r.rep--;
          }
          r.supplyDiscount = (r.supplyDiscount >= 15 ? 15 : (r.supplyDiscount || 0) + 1)
}\`;
creatorCache['Start Journey']={};
creatorCache['Start Journey'].affected=[''];
creatorCache['Start Journey'].canStart={};
creatorCache['Start Journey'].canStart.game=\`canStart() {
		const squirrelRequirements = (!this.squirrelAction || resources.squirrel);
		return squirrelRequirements && resources.supplies;
    }\`;
creatorCache['Start Journey'].canStart.pred=\`r => r.supplies >= 1\`;
creatorCache['Start Journey'].effect={};
creatorCache['Start Journey'].effect.cost=\`cost() {
        addResource("supplies", false);
    }\`;
creatorCache['Start Journey'].effect.squirrel=\`squirrelActionEffect(onlyGetLoseSquirrel, onlyGetEmptySquirrel) {
		
		let actionEffect = () => {};
		let loseSquirrel = false;
		let nothingHappens = false;
		
		switch(getLevelSquirrelAction("Start Journey")){
						
				case 1: break;
				
				case 2: actionEffect = () => {
							unlockTown(SANCTUARY);
						};
						break;
					
		}
		
		if(onlyGetLoseSquirrel){
			if(loseSquirrel) return true;
			return false;
		}
		
		if(onlyGetEmptySquirrel){
			if(String(actionEffect) === "() => {}" || nothingHappens === true) return true;
			return false;
		}
		
		if(loseSquirrel) addResource("squirrel", false);
		
		actionEffect();
	}\`;
creatorCache['Start Journey'].effect.game=\`finish() {
		unlockTown(FORESTPATH);
    }\`;
creatorCache['Start Journey'].effect.pred=\`(r,k,sq) => {
            r.supplies = 0;
            r.town =sq ? SANCTUARY : FORESTPATH;
          }\`;
creatorCache['Hitch Ride']={};
creatorCache['Hitch Ride'].affected=[''];
creatorCache['Hitch Ride'].canStart={};
creatorCache['Hitch Ride'].canStart.game=\`canStart() {
        return true;
    }\`;
creatorCache['Hitch Ride'].canStart.pred=\`true\`;
creatorCache['Hitch Ride'].effect={};
creatorCache['Hitch Ride'].effect.game=\`finish() {
        unlockTown(2);
    }\`;
creatorCache['Hitch Ride'].effect.pred=\`(r,k) => ( r.town =2)\`;
creatorCache['Open Rift']={};
creatorCache['Open Rift'].affected=[''];
creatorCache['Open Rift'].effect={};
creatorCache['Open Rift'].effect.game=\`finish() {
        handleSkillExp(this.skills);
        addResource("supplies", false);
        unlockTown(5);
    }\`;
creatorCache['Open Rift'].effect.pred=\`(r,k) => (r.supplies = 0, r.town =5, k.dark+=1000)\`;
creatorCache['Explore Forest']={};
creatorCache['Explore Forest'].affected=[''];
creatorCache['Explore Forest'].canStart={};
creatorCache['Explore Forest'].canStart.game=\`canStart() {
		const squirrelRequirements = (!this.squirrelAction || resources.squirrel);
		return squirrelRequirements;
    }\`;
creatorCache['Explore Forest'].canStart.pred=\`true\`;
creatorCache['Explore Forest'].effect={};
creatorCache['Explore Forest'].effect.squirrel=\`squirrelActionEffect(onlyGetLoseSquirrel, onlyGetEmptySquirrel) {
		
		let actionEffect = () => {};
		let loseSquirrel = false;
		let nothingHappens = false;
		
		switch(getLevelSquirrelAction("Explore Forest")){
						
			case 1: loseSquirrel = true;
				break;
			
			case 2: actionEffect = () => {
						adjustHerbs();
						view.updateRegular("Herbs", FORESTPATH);
					};
					nothingHappens = true;
					break;
			
			case 3: actionEffect = () => {
						adjustWildMana();
						view.updateRegular("WildMana", FORESTPATH);
					};
					nothingHappens = true;
					break;
				
		}
		
		if(onlyGetLoseSquirrel){
			if(loseSquirrel) return true;
			return false;
		}
		
		if(onlyGetEmptySquirrel){
			if(String(actionEffect) === "() => {}" || nothingHappens === true) return true;
			return false;
		}
		
		if(loseSquirrel) addResource("squirrel", false);
		
		actionEffect();
	}\`;
creatorCache['Explore Forest'].effect.game=\`finish() {
		
		towns[FORESTPATH].finishProgress(this.varName, 100 * (resources.glasses ? 4 : 1));
        
    }\`;
creatorCache['Explore Forest'].effect.pred=\`(r,k,sq)=>{if (sq && getLevelSquirrelAction("Explore Forest")<=1) h.killSquirrel(r)}\`;
creatorCache['Wild Mana']={};
creatorCache['Wild Mana'].affected=['mana'];
creatorCache['Wild Mana'].manaCost={};
creatorCache['Wild Mana'].manaCost.game=\`manaCost(squirrelTooltip) {
		const squirrelMult = (((this.squirrelAction || squirrelTooltip) && getLevelSquirrelAction("Wild Mana") >= 3) ? 0.85 : 1);
        return 300 * squirrelMult;
    }\`;
creatorCache['Wild Mana'].manaCost.pred=\`\`;
creatorCache['Wild Mana'].canStart={};
creatorCache['Wild Mana'].canStart.game=\`canStart() {
		const squirrelRequirements = (!this.squirrelAction || resources.squirrel);
		return squirrelRequirements;
    }\`;
creatorCache['Wild Mana'].canStart.pred=\`true\`;
creatorCache['Wild Mana'].effect={};
creatorCache['Wild Mana'].effect.squirrel=\`squirrelActionEffect(onlyGetLoseSquirrel, onlyGetEmptySquirrel) {
		
		let actionEffect = () => {};
		let loseSquirrel = false;
		let nothingHappens = false;
		
		switch(getLevelSquirrelAction("Wild Mana")){
						
			case 1: actionEffect = () => {
						towns[FORESTPATH].finishRegular(this.varName, 10, () => {
							const manaGain = this.goldCost();
							addMana(manaGain);
							return manaGain;
						});
					};
					break;
				
			case 2: actionEffect = () => {
						towns[FORESTPATH].finishRegular(this.varName, 10, () => {
							const manaGain = this.goldCost()+100;
							addMana(manaGain);
							return manaGain;
						});
					};
					break;
			
			case 3: actionEffect = () => {
						towns[FORESTPATH].finishRegular(this.varName, 10, () => {
							const manaGain = this.goldCost()+100;
							addMana(manaGain);
							return manaGain;
						});
						view.adjustManaCost("Wild Mana", squirrelMode);
					};
					break;
					
		}
		
		if(onlyGetLoseSquirrel){
			if(loseSquirrel) return true;
			return false;
		}
		
		if(onlyGetEmptySquirrel){
			if(String(actionEffect) === "() => {}" || nothingHappens === true) return true;
			return false;
		}
		
		if(loseSquirrel) addResource("squirrel", false);
		
		actionEffect();
	}\`;
creatorCache['Wild Mana'].effect.game=\`finish() {
		
		towns[FORESTPATH].finishRegular(this.varName, 10, () => {
			const manaGain = this.goldCost();
			addMana(manaGain);
			return manaGain;
		});
		

    }\`;
creatorCache['Wild Mana'].effect.pred=\`(r,k,sq) => {
          r.temp5 = (r.temp5 || 0) + 1;
          const sqBonus= (sq &&getLevelSquirrelAction("Wild Mana")>=2) ? 100:0;
          r.mana += r.temp5 <= towns[FORESTPATH].goodWildMana ?  Action.WildMana.goldCost()+sqBonus : 0;
        }\`;
creatorCache['Gather Herbs']={};
creatorCache['Gather Herbs'].affected=['herbs'];
creatorCache['Gather Herbs'].manaCost={};
creatorCache['Gather Herbs'].manaCost.game=\`manaCost() {
        return Math.ceil(400 * (1 - towns[FORESTPATH].getLevel("Hermit") * 0.005));
    }\`;
creatorCache['Gather Herbs'].manaCost.pred=\`\`;
creatorCache['Gather Herbs'].canStart={};
creatorCache['Gather Herbs'].canStart.game=\`canStart() {
		const squirrelRequirements = (!this.squirrelAction || resources.squirrel);
		return squirrelRequirements;
    }\`;
creatorCache['Gather Herbs'].canStart.pred=\`true\`;
creatorCache['Gather Herbs'].effect={};
creatorCache['Gather Herbs'].effect.squirrel=\`squirrelActionEffect(onlyGetLoseSquirrel, onlyGetEmptySquirrel) {
		
		let actionEffect = () => {};
		let loseSquirrel = false;
		let nothingHappens = false;
		
		switch(getLevelSquirrelAction("Gather Herbs")){
						
			case 1:	break;
				
			case 2: actionEffect = () => {
						towns[FORESTPATH].finishRegular(this.varName, 10, () => {
							const manaGain = 200;
							addMana(manaGain);
							return manaGain;
						});
					};
					break;
			
			case 3: actionEffect = () => {
						towns[FORESTPATH].finishRegular(this.varName, 10, () => {
							const manaGain = 275;
							addMana(manaGain);
							return manaGain;
						});
					};
					break;
					
		}
		
		if(onlyGetLoseSquirrel){
			if(loseSquirrel) return true;
			return false;
		}
		
		if(onlyGetEmptySquirrel){
			if(String(actionEffect) === "() => {}" || nothingHappens === true) return true;
			return false;
		}
		
		if(loseSquirrel) addResource("squirrel", false);
		
		actionEffect();
	}\`;
creatorCache['Gather Herbs'].effect.game=\`finish() {
		
		 towns[FORESTPATH].finishRegular(this.varName, 10, () => {
			addResource("herbs", 1);
			return 1;
		});
       
    }\`;
creatorCache['Gather Herbs'].effect.pred=\`(r,k,sq) => {
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
        }\`;
creatorCache['Hunt']={};
creatorCache['Hunt'].affected=['hide'];
creatorCache['Hunt'].manaCost={};
creatorCache['Hunt'].manaCost.game=\`manaCost(squirrelTooltip) {
		const squirrelMult = (((this.squirrelAction || squirrelTooltip) && getLevelSquirrelAction("Hunt") >= 2) ? 0.8 : 1);
        return 1600 * squirrelMult;
    }\`;
creatorCache['Hunt'].manaCost.pred=\`\`;
creatorCache['Hunt'].canStart={};
creatorCache['Hunt'].canStart.game=\`canStart() {
		const squirrelRequirements = (!this.squirrelAction || resources.squirrel);
		return squirrelRequirements;
    }\`;
creatorCache['Hunt'].canStart.pred=\`true\`;
creatorCache['Hunt'].effect={};
creatorCache['Hunt'].effect.squirrel=\`squirrelActionEffect(onlyGetLoseSquirrel, onlyGetEmptySquirrel) {
		
		let actionEffect = () => {};
		let loseSquirrel = false;
		let nothingHappens = false;
		
		switch(getLevelSquirrelAction("Hunt")){
						
			case 1:	loseSquirrel = true;
					break;
				
			case 2: actionEffect = () => {
						towns[FORESTPATH].finishRegular(this.varName, 10, () => {
							addResource("hide", 1);
							return 1;
						});
						view.adjustManaCost("Hunt", squirrelMode);
					};
					break;
					
		}
		
		if(onlyGetLoseSquirrel){
			if(loseSquirrel) return true;
			return false;
		}
		
		if(onlyGetEmptySquirrel){
			if(String(actionEffect) === "() => {}" || nothingHappens === true) return true;
			return false;
		}
		
		if(loseSquirrel) addResource("squirrel", false);
		
		actionEffect();
	}\`;
creatorCache['Hunt'].effect.game=\`finish() {
		
		towns[FORESTPATH].finishRegular(this.varName, 10, () => {
			addResource("hide", 1);
			return 1;
		});
		
    }\`;
creatorCache['Hunt'].effect.pred=\`(r,k,sq) => {
          if (sq && getLevelSquirrelAction("Hunt")<2) {
            h.killSquirrel(r);
            return;
          }
          r.temp7 = (r.temp7 || 0) + 1;
          r.hide += r.temp7 <= towns[FORESTPATH].goodHunt ? 1 : 0;
        }\`;
creatorCache['Sit By Waterfall']={};
creatorCache['Sit By Waterfall'].affected=[''];
creatorCache['Sit By Waterfall'].canStart={};
creatorCache['Sit By Waterfall'].canStart.game=\`canStart() {
		const squirrelRequirements = (!this.squirrelAction || resources.squirrel);
		return squirrelRequirements;
    }\`;
creatorCache['Sit By Waterfall'].canStart.pred=\`true\`;
creatorCache['Sit By Waterfall'].effect={};
creatorCache['Sit By Waterfall'].effect.squirrel=\`squirrelActionEffect(onlyGetLoseSquirrel, onlyGetEmptySquirrel) {
		
		let actionEffect = () => {};
		let loseSquirrel = false;
		let nothingHappens = false;
		
		switch(getLevelSquirrelAction("Sit By Waterfall")){
						
			case 1:	loseSquirrel = true;
					break;								
		}
		
		if(onlyGetLoseSquirrel){
			if(loseSquirrel) return true;
			return false;
		}
		
		if(onlyGetEmptySquirrel){
			if(String(actionEffect) === "() => {}" || nothingHappens === true) return true;
			return false;
		}
		
		if(loseSquirrel) addResource("squirrel", false);
		
		actionEffect();
	}\`;
creatorCache['Sit By Waterfall'].effect.game=\`finish() {
		
		unlockStory("satByWaterfall");
     
    }\`;
creatorCache['Sit By Waterfall'].effect.pred=\`(r,k,sq)=>sq?h.killSquirrel(r):0\`;
creatorCache['Old Shortcut']={};
creatorCache['Old Shortcut'].affected=[''];
creatorCache['Old Shortcut'].canStart={};
creatorCache['Old Shortcut'].canStart.game=\`canStart() {
		const squirrelRequirements = (!this.squirrelAction || resources.squirrel);
		return squirrelRequirements;
    }\`;
creatorCache['Old Shortcut'].canStart.pred=\`true\`;
creatorCache['Old Shortcut'].effect={};
creatorCache['Old Shortcut'].effect.squirrel=\`squirrelActionEffect(onlyGetLoseSquirrel, onlyGetEmptySquirrel) {
		
		let actionEffect = () => {};
		let loseSquirrel = false;
		let nothingHappens = false;
		
		switch(getLevelSquirrelAction("Old Shortcut")){
						
			case 1:	loseSquirrel = true;
					break;

			case 2:	actionEffect = () => {
						towns[FORESTPATH].finishProgress(this.varName, 100 * (1 + towns[FORESTPATH].getLevel("Hermit") / 25));
						view.adjustManaCost("Continue On");
						view.adjustManaCost("Talk To Hermit");
					};
					break;
					
			case 3:	actionEffect = () => {
						towns[FORESTPATH].finishProgress(this.varName, 100 * (1 + towns[FORESTPATH].getLevel("Hermit") / 20));
						view.adjustManaCost("Continue On");
						view.adjustManaCost("Talk To Hermit");
					};
					break;
		}
		
		if(onlyGetLoseSquirrel){
			if(loseSquirrel) return true;
			return false;
		}
		
		if(onlyGetEmptySquirrel){
			if(String(actionEffect) === "() => {}" || nothingHappens === true) return true;
			return false;
		}
		
		if(loseSquirrel) addResource("squirrel", false);
		
		actionEffect();
	}\`;
creatorCache['Old Shortcut'].effect.game=\`finish() {
		
		towns[FORESTPATH].finishProgress(this.varName, 100 * (1 + towns[FORESTPATH].getLevel("Hermit") / 33.3333333));
		view.adjustManaCost("Continue On");
		view.adjustManaCost("Talk To Hermit");
        
    }\`;
creatorCache['Old Shortcut'].effect.pred=\`(r,k,sq)=>(sq && getLevelSquirrelAction("Old Shortcut")<2)?h.killSquirrel(r):0\`;
creatorCache['Talk To Hermit']={};
creatorCache['Talk To Hermit'].affected=[''];
creatorCache['Talk To Hermit'].canStart={};
creatorCache['Talk To Hermit'].canStart.game=\`canStart() {
		const squirrelRequirements = (!this.squirrelAction || resources.squirrel);
		return squirrelRequirements;
    }\`;
creatorCache['Talk To Hermit'].canStart.pred=\`true\`;
creatorCache['Talk To Hermit'].effect={};
creatorCache['Talk To Hermit'].effect.squirrel=\`squirrelActionEffect(onlyGetLoseSquirrel, onlyGetEmptySquirrel) {
		
		let actionEffect = () => {};
		let loseSquirrel = false;
		let nothingHappens = false;
		
		switch(getLevelSquirrelAction("Talk To Hermit")){
						
			case 1:	loseSquirrel = true;
					break;

			case 2:	actionEffect = () => {
						towns[FORESTPATH].finishProgress(this.varName, 50 * (1 + towns[FORESTPATH].getLevel("Shortcut") / 25));
						view.adjustManaCost("Old Shortcut");
						view.adjustManaCost("Practice Yang");
						view.adjustManaCost("Learn Alchemy");
						view.adjustManaCost("Gather Herbs");
					};
					break;
					
			case 3:	actionEffect = () => {
						towns[FORESTPATH].finishProgress(this.varName, 50 * (1 + towns[FORESTPATH].getLevel("Shortcut") / 20));
						view.adjustManaCost("Old Shortcut");
						view.adjustManaCost("Practice Yang");
						view.adjustManaCost("Learn Alchemy");
						view.adjustManaCost("Gather Herbs");
					};
					break;
		}
		
		if(onlyGetLoseSquirrel){
			if(loseSquirrel) return true;
			return false;
		}
		
		if(onlyGetEmptySquirrel){
			if(String(actionEffect) === "() => {}" || nothingHappens === true) return true;
			return false;
		}
		
		if(loseSquirrel) addResource("squirrel", false);
		
		actionEffect();
	}\`;
creatorCache['Talk To Hermit'].effect.game=\`finish() {
		
		towns[FORESTPATH].finishProgress(this.varName, 50 * (1 + towns[FORESTPATH].getLevel("Shortcut") / 33.3333333));
		view.adjustManaCost("Old Shortcut");
		view.adjustManaCost("Practice Yang");
		view.adjustManaCost("Learn Alchemy");
		view.adjustManaCost("Gather Herbs");
        
    }\`;
creatorCache['Talk To Hermit'].effect.pred=\`(r,k,sq)=>(sq && getLevelSquirrelAction("Talk To Hermit")<2)?h.killSquirrel(r):0\`;
creatorCache['Practice Yang']={};
creatorCache['Practice Yang'].affected=['rep'];
creatorCache['Practice Yang'].manaCost={};
creatorCache['Practice Yang'].manaCost.game=\`manaCost() {
        return Math.ceil(8000 * (1 - towns[FORESTPATH].getLevel("Hermit") * 0.005));
    }\`;
creatorCache['Practice Yang'].manaCost.pred=\`\`;
creatorCache['Practice Yang'].canStart={};
creatorCache['Practice Yang'].canStart.game=\`canStart() {
		const squirrelRequirements = (!this.squirrelAction || resources.squirrel);
		return squirrelRequirements;
    }\`;
creatorCache['Practice Yang'].canStart.pred=\`true\`;
creatorCache['Practice Yang'].effect={};
creatorCache['Practice Yang'].effect.skills={};	
creatorCache['Practice Yang'].effect.skills.Yang=\`Yang() {
			const additionalExp = (resources.reputation >= 0 ? resources.reputation * 25 : 0);
            return 100 + additionalExp;
        }\`,
creatorCache['Practice Yang'].effect.squirrel=\`squirrelActionEffect(onlyGetLoseSquirrel, onlyGetEmptySquirrel) {
		
		let actionEffect = () => {};
		let loseSquirrel = false;
		let nothingHappens = false;
		
		switch(getLevelSquirrelAction("Practice Yang")){
						
			case 1:	break;

			case 2:	actionEffect = () => {
						addResource("reputation", 4);
					};
					loseSquirrel = true;
					break;

		}
		
		if(onlyGetLoseSquirrel){
			if(loseSquirrel) return true;
			return false;
		}
		
		if(onlyGetEmptySquirrel){
			if(String(actionEffect) === "() => {}" || nothingHappens === true) return true;
			return false;
		}
		
		if(loseSquirrel) addResource("squirrel", false);
		
		actionEffect();
	}\`;
creatorCache['Practice Yang'].effect.game=\`finish() {
		
		handleSkillExp(this.skills);
		
    }\`;
creatorCache['Practice Yang'].effect.pred=\`(r,k,sq) => {
          if (sq) {
            if (getLevelSquirrelAction("Practice Yang")>=2) {
              h.killSquirrel(r);
              r.rep+=4;
            }
          } else {
            k.yang+=100 + (r.rep >= 0 ? r.rep * 25 : 0);
          }
        }\`;
creatorCache['Learn Alchemy']={};
creatorCache['Learn Alchemy'].affected=['herbs'];
creatorCache['Learn Alchemy'].manaCost={};
creatorCache['Learn Alchemy'].manaCost.game=\`manaCost() {
        return Math.ceil(9600 * (1 - towns[FORESTPATH].getLevel("Hermit") * 0.005));
    }\`;
creatorCache['Learn Alchemy'].manaCost.pred=\`\`;
creatorCache['Learn Alchemy'].canStart={};
creatorCache['Learn Alchemy'].canStart.game=\`canStart() {
		const squirrelRequirements = (!this.squirrelAction || resources.squirrel);
		return squirrelRequirements && resources.herbs >= 10;
    }\`;
creatorCache['Learn Alchemy'].canStart.pred=\`(input) => (input.herbs >= 10)\`;
creatorCache['Learn Alchemy'].effect={};
creatorCache['Learn Alchemy'].effect.skills={};	
creatorCache['Learn Alchemy'].effect.skills.Alchemy=\`Alchemy() {
			let brewingLevel = getSkillLevel("Brewing");
			let brewingMultiplier = 0;
			
			for(let levelsNeededForBoost = 1; brewingLevel > 0; levelsNeededForBoost++) {
				for (let i = 0; i < 10 && brewingLevel > 0; i++){
				
					brewingMultiplier += 1;
					brewingLevel -= levelsNeededForBoost;
				
				}
			}
			
			return 100 + brewingMultiplier * 10;
		}\`,
creatorCache['Learn Alchemy'].effect.cost=\`cost() {
        addResource("herbs", -10);
    }\`;
creatorCache['Learn Alchemy'].effect.squirrel=\`squirrelActionEffect(onlyGetLoseSquirrel, onlyGetEmptySquirrel) {
		
		let actionEffect = () => {};
		let loseSquirrel = false;
		let nothingHappens = false;
		
		switch(getLevelSquirrelAction("Learn Alchemy")){
						
			case 1:	break;

		}
		
		if(onlyGetLoseSquirrel){
			if(loseSquirrel) return true;
			return false;
		}
		
		if(onlyGetEmptySquirrel){
			if(String(actionEffect) === "() => {}" || nothingHappens === true) return true;
			return false;
		}
		
		if(loseSquirrel) addResource("squirrel", false);
		
		actionEffect();
	}\`;
creatorCache['Learn Alchemy'].effect.game=\`finish() {
		
		handleSkillExp(this.skills);
		view.adjustExpGain(Action.LearnBrewing);
		view.adjustExpGain(Action.ConcoctPotions);
    
    }\`;
creatorCache['Learn Alchemy'].effect.pred=\`(r, k, sq) => {
            if (sq) return;
            r.herbs -= 10;
            let brewingLevel = getSkillLevelFromExp(k.brewing);
			let brewingMultiplier = 0;			
			for(let levelsNeededForBoost = 1; brewingLevel > 0; levelsNeededForBoost++) {
				for (let i = 0; i < 10 && brewingLevel > 0; i++){
					brewingMultiplier += 1;
					brewingLevel -= levelsNeededForBoost;				
				}
			}
            k.alchemy += 100 + brewingMultiplier * 10;
          }\`;
creatorCache['Distill Potions']={};
creatorCache['Distill Potions'].affected=['herbs','potions'];
creatorCache['Distill Potions'].canStart={};
creatorCache['Distill Potions'].canStart.game=\`canStart() {
		const squirrelRequirements = (!this.squirrelAction || resources.squirrel);
		return squirrelRequirements && resources.herbs >= 10 && resources.reputation >= 10;
    }\`;
creatorCache['Distill Potions'].canStart.pred=\`(input) => {
          return (input.herbs>=10 && input.rep>=10);
        }\`;
creatorCache['Distill Potions'].loop={};
creatorCache['Distill Potions'].loop.cost={};
creatorCache['Distill Potions'].loop.cost.game=\`loopCost(segment) {
		const numberLoops = towns[FORESTPATH].DistillLoopCounter / 3;
        return Math.floor(Math.pow(1.6, numberLoops)+ 0.0000001) * 40000;
    }\`;
creatorCache['Distill Potions'].loop.cost.pred=\`(p) => segment =>  Math.floor(Math.pow(1.6, p.completed/3)+0.0000001)*40000\`;
creatorCache['Distill Potions'].loop.tick={};
creatorCache['Distill Potions'].loop.tick.game=\`tickProgress(offset) {
		if(this.squirrelAction) return 0;
        return (getSkillLevel("Alchemy") + getSkillLevel("Brewing")/2) * (1 + getLevel(this.loopStats[(towns[FORESTPATH].DistillLoopCounter + offset) % this.loopStats.length]) / 100) * Math.sqrt(1 + towns[FORESTPATH].totalDistill / 100);
    }\`;
creatorCache['Distill Potions'].loop.tick.pred=\`(p, a, s, k, r,sq) => offset => (r.herbs<10||sq) ? 0 : (getSkillLevelFromExp(k.alchemy) + getSkillLevelFromExp(k.brewing)/2) * h.getStatProgress(p, a, s, offset, 100) * Math.sqrt(1 + p.total / 100)\`;
creatorCache['Distill Potions'].loop.end={};
creatorCache['Distill Potions'].loop.end.skills={};	
creatorCache['Distill Potions'].loop.end.skills.Alchemy=\`Alchemy() {
			let brewingLevel = getSkillLevel("Brewing");
			let brewingMultiplier = 0;
			
			for(let levelsNeededForBoost = 1; brewingLevel > 0; levelsNeededForBoost++) {
				for (let i = 0; i < 10 && brewingLevel > 0; i++){
				
					brewingMultiplier += 1;
					brewingLevel -= levelsNeededForBoost;
				
				}
			}
			
			return 100 + brewingMultiplier * 10;
		}\`,
creatorCache['Distill Potions'].loop.end.squirrel=\`squirrelActionEffect(onlyGetLoseSquirrel, onlyGetEmptySquirrel) {
		
		let actionEffect = () => {};
		let loseSquirrel = false;
		let nothingHappens = false;
		
		switch(getLevelSquirrelAction("Distill Potions")){
						
			case 1:	break;

		}
		
		if(onlyGetLoseSquirrel){
			if(loseSquirrel) return true;
			return false;
		}
		
		if(onlyGetEmptySquirrel){
			if(String(actionEffect) === "() => {}" || nothingHappens === true) return true;
			return false;
		}
		
		if(loseSquirrel) addResource("squirrel", false);
		
		actionEffect();
	}\`;
creatorCache['Distill Potions'].loop.end.game=\`finish() {
		
    }\`;
creatorCache['Distill Potions'].loop.end.pred=\`\`;
creatorCache['Distill Potions'].loop.loop={};
creatorCache['Distill Potions'].loop.loop.game=\`loopsFinished() {
		addResource("herbs", -10);
        addResource("potions", 1);
		handleSkillExp(this.skills);
		view.adjustExpGain(Action.LearnBrewing);
		view.adjustExpGain(Action.ConcoctPotions);
    }\`;
creatorCache['Distill Potions'].loop.loop.pred=\`(r,k) => {
            r.herbs-=10;
            r.potions++;
            let brewingLevel = getSkillLevelFromExp(k.brewing);
			let brewingMultiplier = 0;			
			for(let levelsNeededForBoost = 1; brewingLevel > 0; levelsNeededForBoost++) {
				for (let i = 0; i < 10 && brewingLevel > 0; i++){
					brewingMultiplier += 1;
					brewingLevel -= levelsNeededForBoost;				
				}
			}
            k.alchemy += 100 + brewingMultiplier * 10;
            }\`;
creatorCache['Distill Potions'].loop.max=\`\`;
creatorCache['Train Squirrel']={};
creatorCache['Train Squirrel'].affected=[''];
creatorCache['Train Squirrel'].canStart={};
creatorCache['Train Squirrel'].canStart.game=\`canStart() {
		return resources.squirrel;
    }\`;
creatorCache['Train Squirrel'].canStart.pred=\`(input,sq) => input.squirrel\`;
creatorCache['Train Squirrel'].effect={};
creatorCache['Train Squirrel'].effect.skillsSquirrel={};	
creatorCache['Train Squirrel'].effect.skillsSquirrel.Combat=\`Combat() {
			return getSelfCombat() * 4;
		}\`,
creatorCache['Train Squirrel'].effect.squirrel=\`squirrelActionEffect(onlyGetLoseSquirrel, onlyGetEmptySquirrel) {
		
		let actionEffect = () => {};
		let loseSquirrel = false;
		let nothingHappens = false;
		
		switch(getLevelSquirrelAction("Train Squirrel")){
						
			case 1:	loseSquirrel = true;
				break;
			
			case 2: actionEffect = () => {
						handleSkillSquirrelExp({Combat() {return getSkillSquirrelLevel("Combat") * 10;}});
					};
					loseSquirrel = true;
				break;
		}
		
		if(onlyGetLoseSquirrel){
			if(loseSquirrel) return true;
			return false;
		}
		
		if(onlyGetEmptySquirrel){
			if(String(actionEffect) === "() => {}" || nothingHappens === true) return true;
			return false;
		}
		
		if(loseSquirrel) addResource("squirrel", false);
		
		actionEffect();
	}\`;
creatorCache['Train Squirrel'].effect.game=\`finish() {
		
		handleSkillSquirrelExp(this.skillsSquirrel);
		
    }\`;
creatorCache['Train Squirrel'].effect.pred=\`(r,k,sq) => {
          let smult=1;
          if (sq) {
            h.killSquirrel(r);
            if (getLevelSquirrelAction("Train Squirrel")>=2) {
              k.combat_squirrel+=getLevelFromExp(k.combat_squirrel)*10;
            }
          } else {
            k.combat_squirrel+=smult * 4* h.getSelfCombat(r, k);
		  }
        }\`;
creatorCache['Feed Animals']={};
creatorCache['Feed Animals'].affected=['herbs'];
creatorCache['Feed Animals'].canStart={};
creatorCache['Feed Animals'].canStart.game=\`canStart() {
		const squirrelRequirements = (!this.squirrelAction || resources.squirrel);
		return squirrelRequirements && resources.herbs >= 10;
    }\`;
creatorCache['Feed Animals'].canStart.pred=\`(input) => {
          return input.herbs>=10;
        }\`;
creatorCache['Feed Animals'].effect={};
creatorCache['Feed Animals'].effect.cost=\`cost() {
        addResource("herbs", -10);
    }\`;
creatorCache['Feed Animals'].effect.squirrel=\`squirrelActionEffect(onlyGetLoseSquirrel, onlyGetEmptySquirrel) {
		
		let actionEffect = () => {};
		let loseSquirrel = false;
		let nothingHappens = false;
		
		switch(getLevelSquirrelAction("Feed Animals")){
						
			case 1:	loseSquirrel = true;
				break;
			
			case 2: actionEffect = () => {
						adjustWildMana();
						view.updateRegular("WildMana", FORESTPATH);
					};
					loseSquirrel = true;
					nothingHappens = true;
				break;
				
			case 3: actionEffect = () => {
						adjustHerbs();
						view.updateRegular("Herbs", FORESTPATH);
					};
					loseSquirrel = true;
					nothingHappens = true;
				break;
		}
		
		if(onlyGetLoseSquirrel){
			if(loseSquirrel) return true;
			return false;
		}
		
		if(onlyGetEmptySquirrel){
			if(String(actionEffect) === "() => {}" || nothingHappens === true) return true;
			return false;
		}
		
		if(loseSquirrel) addResource("squirrel", false);
		
		actionEffect();
	}\`;
creatorCache['Feed Animals'].effect.game=\`finish() {
		
		towns[FORESTPATH].finishProgress(this.varName, 100 * (1 + resources.herbs * 0.02));
   
		if(getLevelSquirrelAction("Pet Squirrel") === 0) levelUpSquirrelAction("Pet Squirrel");
		if(getLevelSquirrelAction("Pet Squirrel") === 1) levelUpSquirrelAction("Pet Squirrel");

	   
    }\`;
creatorCache['Feed Animals'].effect.pred=\`(r,k,sq) => {
          if (sq) h.killSquirrel(r);
          r.herbs-=10;
        }\`;
creatorCache['Pot Fairy']={};
creatorCache['Pot Fairy'].affected=['rep','mana','herbs'];
creatorCache['Pot Fairy'].canStart={};
creatorCache['Pot Fairy'].canStart.game=\`canStart() {
		const squirrelRequirements = (!this.squirrelAction || resources.squirrel);
		return squirrelRequirements;
    }\`;
creatorCache['Pot Fairy'].canStart.pred=\`true\`;
creatorCache['Pot Fairy'].effect={};
creatorCache['Pot Fairy'].effect.squirrel=\`squirrelActionEffect(onlyGetLoseSquirrel, onlyGetEmptySquirrel) {
		
		let actionEffect = () => {};
		let loseSquirrel = false;
		let nothingHappens = false;
		
		switch(getLevelSquirrelAction("Pot Fairy")){
						
			case 1:	break;
			
			case 2: actionEffect = () => {
						if(towns[BEGINNERSVILLE].goodTempPots == towns[BEGINNERSVILLE].goodPots){
							const multPots = towns[BEGINNERSVILLE].goodPots/10;
							addResource("reputation", multPots);
							addMana(multPots * 2000);
							
							const herbsToGather = Math.min(100, towns[FORESTPATH].goodTempHerbs);
							addResource("herbs", herbsToGather);
							towns[FORESTPATH].goodTempHerbs -= herbsToGather;
							view.updateRegular("Herbs", FORESTPATH);
							
						} else {
							if(resources.reputation >= 0) {
								const reputToRemove = resources.reputation * (-2);
								addResource("reputation", reputToRemove);
							}
						}
					};
					break;
				
			case 3: actionEffect = () => {
						if(towns[BEGINNERSVILLE].goodTempPots == towns[BEGINNERSVILLE].goodPots){
							const multPots = towns[BEGINNERSVILLE].goodPots/10;
							addResource("reputation", multPots);
							addMana(multPots * 2000);
							
							addResource("herbs", towns[FORESTPATH].goodTempHerbs);
							towns[FORESTPATH].goodTempHerbs  = 0;	
							view.updateRegular("Herbs", FORESTPATH);
							
						} else {
							if(resources.reputation >= 0) {
								const reputToRemove = resources.reputation * (-2);
								addResource("reputation", reputToRemove);
							}
						}
					};
					break;
		}
		
		if(onlyGetLoseSquirrel){
			if(loseSquirrel) return true;
			return false;
		}
		
		if(onlyGetEmptySquirrel){
			if(String(actionEffect) === "() => {}" || nothingHappens === true) return true;
			return false;
		}
		
		if(loseSquirrel) addResource("squirrel", false);
		
		actionEffect();
	}\`;
creatorCache['Pot Fairy'].effect.game=\`finish() {	

		if(towns[BEGINNERSVILLE].goodTempPots == towns[BEGINNERSVILLE].goodPots){
			const multPots = towns[BEGINNERSVILLE].goodPots/10;
			addResource("reputation", multPots);
			addMana(multPots * 2000);
		} else {
			if(resources.reputation >= 0) {
				const reputToRemove = resources.reputation * (-2);
				addResource("reputation", reputToRemove);
			}
		}
		
    }\`;
creatorCache['Pot Fairy'].effect.pred=\`(r,k,sq) => {
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
        }\`;
creatorCache['Burn Forest']={};
creatorCache['Burn Forest'].affected=['herbs','darkEssences'];
creatorCache['Burn Forest'].canStart={};
creatorCache['Burn Forest'].canStart.game=\`canStart() {
		const squirrelRequirements = (!this.squirrelAction || resources.squirrel);
		return squirrelRequirements && resources.herbs >= 10 && resources.reputation < 0;
    }\`;
creatorCache['Burn Forest'].canStart.pred=\`(input) => {
          return (input.rep<0 && input.herbs>=10)
        }\`;
creatorCache['Burn Forest'].loop={};
creatorCache['Burn Forest'].loop.cost={};
creatorCache['Burn Forest'].loop.cost.game=\`loopCost(segment) {
        return 75000;
    }\`;
creatorCache['Burn Forest'].loop.cost.pred=\`(p) => segment => 75000\`;
creatorCache['Burn Forest'].loop.tick={};
creatorCache['Burn Forest'].loop.tick.game=\`tickProgress(offset) {
		const squirrelHelp = ((this.squirrelAction && getLevelSquirrelAction("Burn Forest") >= 1) ? 10 : 0);
        return (resources.herbs + squirrelHelp) *  Math.sqrt((1 + getLevel(this.loopStats[(towns[FORESTPATH].BurnLoopCounter + offset) % this.loopStats.length]) / 1000));
    }\`;
creatorCache['Burn Forest'].loop.tick.pred=\`(p, a, s, k, r, sq) => offset => r.herbs<10 ? 0 : (r.herbs+(sq?10:0)) *  Math.sqrt(h.getStatProgress(p, a, s, offset, 1000))\`;
creatorCache['Burn Forest'].loop.end={};
creatorCache['Burn Forest'].loop.end.squirrel=\`squirrelActionEffect(onlyGetLoseSquirrel, onlyGetEmptySquirrel) {
		
		let actionEffect = () => {};
		let loseSquirrel = false;
		let nothingHappens = false;
		
		switch(getLevelSquirrelAction("Burn Forest")){
						
			case 1:	actionEffect = () => {/*Has an effect*/};
					loseSquirrel = true;
				break;
			
			case 2:actionEffect = () => {/*Has an effect*/};
					break;

		}
		
		if(onlyGetLoseSquirrel){
			if(loseSquirrel) return true;
			return false;
		}
		
		if(onlyGetEmptySquirrel){
			if(String(actionEffect) === "() => {}" || nothingHappens === true) return true;
			return false;
		}
		
		if(loseSquirrel) addResource("squirrel", false);
		
		actionEffect();
	}\`;
creatorCache['Burn Forest'].loop.end.game=\`finish() {
		
    }\`;
creatorCache['Burn Forest'].loop.end.pred=\`(r,k,sq)=> {
          if (sq && getLevelSquirrelAction("Burn Forest")<=1) {
            h.killSquirrel(r);
          }
        }\`;
creatorCache['Burn Forest'].loop.loop={};
creatorCache['Burn Forest'].loop.loop.game=\`loopsFinished() {
		addMana(3500);
        addResource("darkEssences", Math.floor(towns[FORESTPATH].getLevel("DarkForest")/10 + 0.000001));
		addResource("herbs", -10);
		if(towns[FORESTPATH].BurnLoopCounter%4 === 0) addResource("reputation", -1);
    }\`;
creatorCache['Burn Forest'].loop.loop.pred=\`(r,k) => {r.mana+=3500;r.herbs-=10;r.darkEssences+=Math.floor(towns[FORESTPATH].getLevel("DarkForest")/10 + 0.000001);r.forestBurn=(r.forestBurn||0)+1; if(r.forestBurn%2==0) r.rep-=1;}\`;
creatorCache['Burn Forest'].loop.max=\`\`;
creatorCache['Bird Watching']={};
creatorCache['Bird Watching'].affected=[''];
creatorCache['Bird Watching'].canStart={};
creatorCache['Bird Watching'].canStart.game=\`canStart() {
		const squirrelRequirements = (!this.squirrelAction || resources.squirrel);
		return squirrelRequirements && resources.glasses;
    }\`;
creatorCache['Bird Watching'].canStart.pred=\`(input) => input.glasses\`;
creatorCache['Bird Watching'].effect={};
creatorCache['Bird Watching'].effect.squirrel=\`squirrelActionEffect(onlyGetLoseSquirrel, onlyGetEmptySquirrel) {
		
		let actionEffect = () => {};
		let loseSquirrel = false;
		let nothingHappens = false;
		
		switch(getLevelSquirrelAction("Bird Watching")){
						
			case 1:	actionEffect = () => {
						unlockStory("birdsWatched")
					};
					nothingHappens = true;
					break;
		}
		
		if(onlyGetLoseSquirrel){
			if(loseSquirrel) return true;
			return false;
		}
		
		if(onlyGetEmptySquirrel){
			if(String(actionEffect) === "() => {}" || nothingHappens === true) return true;
			return false;
		}
		
		if(loseSquirrel) addResource("squirrel", false);
		
		actionEffect();
	}\`;
creatorCache['Bird Watching'].effect.game=\`finish() {
		
		 unlockStory("birdsWatched");
    }\`;
creatorCache['Bird Watching'].effect.pred=\`\`;
creatorCache['Dark Forest']={};
creatorCache['Dark Forest'].affected=[''];
creatorCache['Dark Forest'].canStart={};
creatorCache['Dark Forest'].canStart.game=\`canStart() {
		const squirrelRequirements = (!this.squirrelAction || resources.squirrel);
		return squirrelRequirements && resources.reputation < 0;
    }\`;
creatorCache['Dark Forest'].canStart.pred=\`(input) => {
          return input.rep<0;
        }\`;
creatorCache['Dark Forest'].effect={};
creatorCache['Dark Forest'].effect.squirrel=\`squirrelActionEffect(onlyGetLoseSquirrel, onlyGetEmptySquirrel) {
		
		let actionEffect = () => {};
		let loseSquirrel = false;
		let nothingHappens = false;
		
		switch(getLevelSquirrelAction("Dark Forest")){
						
			case 1:	loseSquirrel = true;
				break;
			
			case 2: actionEffect = () => {
						towns[FORESTPATH].finishProgress(this.varName, 100 * (1 + towns[FORESTPATH].getLevel("Witch") / 25));
						view.adjustManaCost("Continue On");
						view.adjustManaCost("Talk To Witch");
					};
					break;
				
			case 3: actionEffect = () => {
						towns[FORESTPATH].finishProgress(this.varName, 100 * (1 + towns[FORESTPATH].getLevel("Witch") / 20));
						view.adjustManaCost("Continue On");
						view.adjustManaCost("Talk To Witch");
					};
					break;
		}
		
		if(onlyGetLoseSquirrel){
			if(loseSquirrel) return true;
			return false;
		}
		
		if(onlyGetEmptySquirrel){
			if(String(actionEffect) === "() => {}" || nothingHappens === true) return true;
			return false;
		}
		
		if(loseSquirrel) addResource("squirrel", false);
		
		actionEffect();
	}\`;
creatorCache['Dark Forest'].effect.game=\`finish() {
		
		towns[FORESTPATH].finishProgress(this.varName, 100 * (1 + towns[FORESTPATH].getLevel("Witch") / 33.33333333));
		view.adjustManaCost("Continue On");
		view.adjustManaCost("Talk To Witch");
		
    }\`;
creatorCache['Dark Forest'].effect.pred=\`(r,k,sq) => {
         if (sq && getLevelSquirrelAction("Dark Forest")<2) h.killSquirrel(r);
        }\`;
creatorCache['Talk To Witch']={};
creatorCache['Talk To Witch'].affected=[''];
creatorCache['Talk To Witch'].canStart={};
creatorCache['Talk To Witch'].canStart.game=\`canStart() {
		const squirrelRequirements = (!this.squirrelAction || resources.squirrel);
		return squirrelRequirements && resources.reputation < 0;
    }\`;
creatorCache['Talk To Witch'].canStart.pred=\`(input)=>(input.rep<0)\`;
creatorCache['Talk To Witch'].effect={};
creatorCache['Talk To Witch'].effect.squirrel=\`squirrelActionEffect(onlyGetLoseSquirrel, onlyGetEmptySquirrel) {
		
		let actionEffect = () => {};
		let loseSquirrel = false;
		let nothingHappens = false;
		
		switch(getLevelSquirrelAction("Talk To Witch")){
						
			case 1:	loseSquirrel = true;
				break;
			
			case 2: actionEffect = () => {
						towns[FORESTPATH].finishProgress(this.varName, 50 * (1 + towns[FORESTPATH].getLevel("DarkForest") / 25));
						view.adjustManaCost("Dark Forest");
						view.adjustManaCost("Practice Yin");
						view.adjustManaCost("Learn Brewing");
					};
					break;
				
			case 3: actionEffect = () => {
						towns[FORESTPATH].finishProgress(this.varName, 50 * (1 + towns[FORESTPATH].getLevel("DarkForest") / 20));
						view.adjustManaCost("Dark Forest");
						view.adjustManaCost("Practice Yin");
						view.adjustManaCost("Learn Brewing");
					};
					break;
		}
		
		if(onlyGetLoseSquirrel){
			if(loseSquirrel) return true;
			return false;
		}
		
		if(onlyGetEmptySquirrel){
			if(String(actionEffect) === "() => {}" || nothingHappens === true) return true;
			return false;
		}
		
		if(loseSquirrel) addResource("squirrel", false);
		
		actionEffect();
	}\`;
creatorCache['Talk To Witch'].effect.game=\`finish() {
		
		towns[FORESTPATH].finishProgress(this.varName, 50 * (1 + towns[FORESTPATH].getLevel("DarkForest") / 33.33333333));
		view.adjustManaCost("Dark Forest");
		view.adjustManaCost("Practice Yin");
		view.adjustManaCost("Learn Brewing");
        
    }\`;
creatorCache['Talk To Witch'].effect.pred=\`(r,k,sq) => {
         if (sq && getLevelSquirrelAction("Talk To Witch")<2) h.killSquirrel(r);
        }\`;
creatorCache['Practice Yin']={};
creatorCache['Practice Yin'].affected=['rep'];
creatorCache['Practice Yin'].manaCost={};
creatorCache['Practice Yin'].manaCost.game=\`manaCost() {
        return Math.ceil(10000 * (1 - towns[FORESTPATH].getLevel("Witch") * 0.005));
    }\`;
creatorCache['Practice Yin'].manaCost.pred=\`\`;
creatorCache['Practice Yin'].canStart={};
creatorCache['Practice Yin'].canStart.game=\`canStart() {
		const squirrelRequirements = (!this.squirrelAction || resources.squirrel);
		return squirrelRequirements;
    }\`;
creatorCache['Practice Yin'].canStart.pred=\`true\`;
creatorCache['Practice Yin'].effect={};
creatorCache['Practice Yin'].effect.skills={};	
creatorCache['Practice Yin'].effect.skills.Yin=\`Yin() {
            const additionalExp = (resources.reputation <= 0 ? resources.reputation * (-25) : 0);
            return 100 + additionalExp;
        }\`,
creatorCache['Practice Yin'].effect.squirrel=\`squirrelActionEffect(onlyGetLoseSquirrel, onlyGetEmptySquirrel) {
		
		let actionEffect = () => {};
		let loseSquirrel = false;
		let nothingHappens = false;
		
		switch(getLevelSquirrelAction("Practice Yin")){
						
			case 1:	break;
			
			case 2: actionEffect = () => {
						addResource("reputation", -4);
					};
					loseSquirrel = true;
				break;
				
		}
	
		if(onlyGetLoseSquirrel){
			if(loseSquirrel) return true;
			return false;
		}
		
		if(onlyGetEmptySquirrel){
			if(String(actionEffect) === "() => {}" || nothingHappens === true) return true;
			return false;
		}
		
		if(loseSquirrel) addResource("squirrel", false);
		
		actionEffect();
	}\`;
creatorCache['Practice Yin'].effect.game=\`finish() {
		
		handleSkillExp(this.skills);
		
    }\`;
creatorCache['Practice Yin'].effect.pred=\`(r,k,sq) => {
          if (sq) {
            if (getLevelSquirrelAction("Practice Yin")>=2) {
              h.killSquirrel(r);
              r.rep-=4;
            }
          } else {
            k.yin+=100 + (r.rep <= 0 ? r.rep * (-25) : 0);
          }
        }\`;
creatorCache['Learn Brewing']={};
creatorCache['Learn Brewing'].affected=['darkEssences'];
creatorCache['Learn Brewing'].manaCost={};
creatorCache['Learn Brewing'].manaCost.game=\`manaCost() {
        return Math.ceil(12000 * (1 - towns[FORESTPATH].getLevel("Witch") * 0.005));
    }\`;
creatorCache['Learn Brewing'].manaCost.pred=\`\`;
creatorCache['Learn Brewing'].canStart={};
creatorCache['Learn Brewing'].canStart.game=\`canStart() {
		const squirrelRequirements = (!this.squirrelAction || resources.squirrel);
		return squirrelRequirements &&  resources.darkEssences >= 10;
    }\`;
creatorCache['Learn Brewing'].canStart.pred=\`(input) => {
          return input.darkEssences>=10;
        }\`;
creatorCache['Learn Brewing'].effect={};
creatorCache['Learn Brewing'].effect.skills={};	
creatorCache['Learn Brewing'].effect.skills.Brewing=\`Brewing() {
			let alchemyLevel = getSkillLevel("Alchemy");
			let alchemyMultiplier = 0;
			
			for(let levelsNeededForBoost = 1; alchemyLevel > 0; levelsNeededForBoost++) {
				for (let i = 0; i < 10 && alchemyLevel > 0; i++){
				
					alchemyMultiplier += 1;
					alchemyLevel -= levelsNeededForBoost;
				
				}
			}
			
			return 100 + alchemyMultiplier * 10;
		}\`,
creatorCache['Learn Brewing'].effect.squirrel=\`squirrelActionEffect(onlyGetLoseSquirrel, onlyGetEmptySquirrel) {
		
		let actionEffect = () => {};
		let loseSquirrel = false;
		
		switch(getLevelSquirrelAction("Learn Brewing")){
						
			case 1:	break;
				
		}
	
		if(onlyGetLoseSquirrel){
			if(loseSquirrel) return true;
			return false;
		}
		
		if(onlyGetEmptySquirrel){
			if(String(actionEffect) === "() => {}" || nothingHappens === true) return true;
			return false;
		}
		
		if(loseSquirrel) addResource("squirrel", false);
		
		actionEffect();
	}\`;
creatorCache['Learn Brewing'].effect.game=\`finish() {
		
		handleSkillExp(this.skills);
		addResource("darkEssences", -10);
		view.adjustExpGain(Action.LearnAlchemy);
		view.adjustExpGain(Action.DistillPotions);
    }\`;
creatorCache['Learn Brewing'].effect.pred=\`(r,k,sq) => {
            if (sq) return;
            r.darkEssences-=10;
            let alchemyLevel = getSkillLevelFromExp(k.alchemy);
			let alchemyMultiplier = 0;			
			for(let levelsNeededForBoost = 1; alchemyLevel > 0; levelsNeededForBoost++) {
				for (let i = 0; i < 10 && alchemyLevel > 0; i++){
					alchemyMultiplier += 1;
					alchemyLevel -= levelsNeededForBoost;				
				}
			}
            k.brewing += 100 + alchemyMultiplier * 10;
          }\`;
creatorCache['Concoct Potions']={};
creatorCache['Concoct Potions'].affected=['rep','darkEssences','darkPotions'];
creatorCache['Concoct Potions'].canStart={};
creatorCache['Concoct Potions'].canStart.game=\`canStart() {
		const squirrelRequirements = (!this.squirrelAction || resources.squirrel);
		return squirrelRequirements && resources.darkEssences >= 10 && resources.reputation <= -10;
    }\`;
creatorCache['Concoct Potions'].canStart.pred=\`(input) => {
            return (input.rep<=-10 && input.darkEssences>=10);
          }\`;
creatorCache['Concoct Potions'].loop={};
creatorCache['Concoct Potions'].loop.cost={};
creatorCache['Concoct Potions'].loop.cost.game=\`loopCost(segment) {
		const numberLoops = towns[FORESTPATH].ConcoctLoopCounter / 3;
        return Math.floor(Math.pow(1.6, numberLoops)+ 0.0000001) * 50000;
    }\`;
creatorCache['Concoct Potions'].loop.cost.pred=\`(p) => segment =>  precision3(Math.pow(1.6, p.completed/3))*50000\`;
creatorCache['Concoct Potions'].loop.tick={};
creatorCache['Concoct Potions'].loop.tick.game=\`tickProgress(offset) {
		if(this.squirrelAction) return 0;
        return (getSkillLevel("Brewing") + getSkillLevel("Alchemy")/2) * (1 + getLevel(this.loopStats[(towns[FORESTPATH].ConcoctLoopCounter + offset) % this.loopStats.length]) / 100) * Math.sqrt(1 + towns[FORESTPATH].totalConcoct / 100);
    }\`;
creatorCache['Concoct Potions'].loop.tick.pred=\`(p, a, s, k, r, sq) => offset => (sq || r.darkEssences<10)?0: (getSkillLevelFromExp(k.alchemy)/2 + getSkillLevelFromExp(k.brewing)) * h.getStatProgress(p, a, s, offset, 100) * Math.sqrt(1 + p.total / 100)\`;
creatorCache['Concoct Potions'].loop.end={};
creatorCache['Concoct Potions'].loop.end.skills={};	
creatorCache['Concoct Potions'].loop.end.skills.Brewing=\`Brewing() {
			let alchemyLevel = getSkillLevel("Alchemy");
			let alchemyMultiplier = 0;
			
			for(let levelsNeededForBoost = 1; alchemyLevel > 0; levelsNeededForBoost++) {
				for (let i = 0; i < 10 && alchemyLevel > 0; i++){
				
					alchemyMultiplier += 1;
					alchemyLevel -= levelsNeededForBoost;
				
				}
			}
			
			return 100 + alchemyMultiplier * 10;
		}\`,
creatorCache['Concoct Potions'].loop.end.squirrel=\`squirrelActionEffect(onlyGetLoseSquirrel, onlyGetEmptySquirrel) {
		
		let actionEffect = () => {};
		let loseSquirrel = false;
		let nothingHappens = false;
		
		switch(getLevelSquirrelAction("Concoct Potions")){
						
			case 1:	break;
				
		}
	
		if(onlyGetLoseSquirrel){
			if(loseSquirrel) return true;
			return false;
		}
		
		if(onlyGetEmptySquirrel){
			if(String(actionEffect) === "() => {}" || nothingHappens === true) return true;
			return false;
		}
		
		if(loseSquirrel) addResource("squirrel", false);
		
		actionEffect();
	}\`;
creatorCache['Concoct Potions'].loop.end.game=\`finish() {
			
    }\`;
creatorCache['Concoct Potions'].loop.end.pred=\`\`;
creatorCache['Concoct Potions'].loop.loop={};
creatorCache['Concoct Potions'].loop.loop.game=\`loopsFinished() {
		addResource("darkEssences", -10);
        addResource("darkPotions", 1);
		handleSkillExp(this.skills);
		view.adjustExpGain(Action.LearnAlchemy);
		view.adjustExpGain(Action.DistillPotions);
    }\`;
creatorCache['Concoct Potions'].loop.loop.pred=\`(r,k) => {
            r.darkEssences-=10;
            r.darkPotions++;
            let alchemyLevel = getSkillLevelFromExp(k.alchemy);
			let alchemyMultiplier = 0;			
			for(let levelsNeededForBoost = 1; alchemyLevel > 0; levelsNeededForBoost++) {
				for (let i = 0; i < 10 && alchemyLevel > 0; i++){
					alchemyMultiplier += 1;
					alchemyLevel -= levelsNeededForBoost;				
				}
			}
            k.brewing += 100 + alchemyMultiplier * 10;
            }\`;
creatorCache['Concoct Potions'].loop.max=\`\`;
creatorCache['Continue On']={};
creatorCache['Continue On'].affected=[''];
creatorCache['Continue On'].manaCost={};
creatorCache['Continue On'].manaCost.game=\`manaCost() {
		let shortcutReduce = towns[FORESTPATH].getLevel("Shortcut");
		if(shortcutReduce <= 50){
			shortcutReduce *= 600;
		} else {
			shortcutReduce = 600 * 50 + (shortcutReduce - 50) * 60;
		}
		
		let darkForestReduce = towns[FORESTPATH].getLevel("DarkForest");
		if(darkForestReduce <= 50){
			darkForestReduce *= 600;
		} else {
			darkForestReduce = 600 * 50 + (darkForestReduce - 50) * 60;
		}
		
        return Math.ceil(70000 - shortcutReduce - darkForestReduce);
    }\`;
creatorCache['Continue On'].manaCost.pred=\`\`;
creatorCache['Continue On'].canStart={};
creatorCache['Continue On'].canStart.game=\`canStart() {
		const squirrelRequirements = (!this.squirrelAction || resources.squirrel);
		return squirrelRequirements;
    }\`;
creatorCache['Continue On'].canStart.pred=\`true\`;
creatorCache['Continue On'].effect={};
creatorCache['Continue On'].effect.squirrel=\`squirrelActionEffect(onlyGetLoseSquirrel, onlyGetEmptySquirrel) {
		
		let actionEffect = () => {};
		let loseSquirrel = false;
		let nothingHappens = false;
		
		switch(getLevelSquirrelAction("Continue On")){
						
			case 1:	break;
			
			case 2: actionEffect = () => {
						unlockTown(SANCTUARY);
					};
					break;
		}
	
		if(onlyGetLoseSquirrel){
			if(loseSquirrel) return true;
			return false;
		}
		
		if(onlyGetEmptySquirrel){
			if(String(actionEffect) === "() => {}" || nothingHappens === true) return true;
			return false;
		}
		
		if(loseSquirrel) addResource("squirrel", false);
		
		actionEffect();
	}\`;
creatorCache['Continue On'].effect.game=\`finish() {
		
		unlockTown(MERCHANTON);
    }\`;
creatorCache['Continue On'].effect.pred=\`(r,k,sq) => r.town = (sq?SANCTUARY:MERCHANTON)\`;
creatorCache['Explore City']={};
creatorCache['Explore City'].affected=[''];
creatorCache['Explore City'].effect={};
creatorCache['Explore City'].effect.game=\`finish() {
		
		const guildMult = getAdvGuildRank().bonus * getCraftGuildRank().bonus;
        towns[MERCHANTON].finishProgress(this.varName, 50 * (resources.glasses ? 4 : 1) * guildMult);
		
    }\`;
creatorCache['Explore City'].effect.pred=\`\`;
creatorCache['Get Drunk']={};
creatorCache['Get Drunk'].affected=['rep'];
creatorCache['Get Drunk'].canStart={};
creatorCache['Get Drunk'].canStart.game=\`canStart() {
        return resources.reputation > 0;
    }\`;
creatorCache['Get Drunk'].canStart.pred=\`(input) => (input.rep > 0)\`;
creatorCache['Get Drunk'].effect={};
creatorCache['Get Drunk'].effect.cost=\`cost() {
        addResource("reputation", -1);
    }\`;
creatorCache['Get Drunk'].effect.game=\`finish() {
        towns[MERCHANTON].finishProgress(this.varName, 80 * getAdvGuildRank().bonus);
    }\`;
creatorCache['Get Drunk'].effect.pred=\`(r) => r.rep--\`;
creatorCache['Help Slums']={};
creatorCache['Help Slums'].affected=['rep'];
creatorCache['Help Slums'].canStart={};
creatorCache['Help Slums'].canStart.game=\`canStart() {
        return resources.reputation < 0;
    }\`;
creatorCache['Help Slums'].canStart.pred=\`(input) => (input.rep < 0)\`;
creatorCache['Help Slums'].effect={};
creatorCache['Help Slums'].effect.cost=\`cost() {
        addResource("reputation", 1);
    }\`;
creatorCache['Help Slums'].effect.game=\`finish() {
        towns[MERCHANTON].finishProgress(this.varName, 80 * getCraftGuildRank().bonus);
    }\`;
creatorCache['Help Slums'].effect.pred=\`(r,k,sq) => r.rep++\`;
creatorCache['Gamble']={};
creatorCache['Gamble'].affected=['gold','rep'];
creatorCache['Gamble'].canStart={};
creatorCache['Gamble'].canStart.game=\`canStart() {
		let costs = 20 + (gamblesInARow*(gamblesInARow+1)/2) * 2
		return resources.gold >= costs && resources.reputation > 0;
    }\`;
creatorCache['Gamble'].canStart.pred=\`(input) => {
        input.gamblesInARow=input.gamblesInARow||0;
		let costs = 20 + (input.gamblesInARow*(input.gamblesInARow+1)/2) * 2;
		return input.gold >= costs && input.rep > 0;
    }\`;
creatorCache['Gamble'].effect={};
creatorCache['Gamble'].effect.cost=\`cost() {
		
		let costs = (20 + (gamblesInARow*(gamblesInARow+1)/2) * 2) * (-1)
        addResource("gold", costs);
		
		if(this.gambleWon){
			gamblesInARow ++;
			this.gambleWon = false;
		}
		else {
			gamblesInARow = 0;
		}
		
		let reputationLost = Math.floor((gamblesInARow+5)/10);
        addResource("reputation", reputationLost * (-1));
		
		view.adjustGoldCost("Gamble", Action.Gamble.goldCost());
		
    }\`;
creatorCache['Gamble'].effect.game=\`finish() {
		
		let goodGambles = towns[MERCHANTON].goodGamble;
		let goodGamblesLeft = towns[MERCHANTON].goodTempGamble;
		
		towns[MERCHANTON].finishRegular(this.varName, 10, () => {
            let goldGain = 20 + ((gamblesInARow+1)*(gamblesInARow+2)/2) * 2
            addResource("gold", goldGain);
            return goldGain;
        });
		
		if((goodGambles + 1 == towns[MERCHANTON].goodGamble) || (goodGamblesLeft - 1 == towns[MERCHANTON].goodTempGamble)){
			this.gambleWon = true;
		}
		
    }\`;
creatorCache['Gamble'].effect.pred=\`(r) => {
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
        }\`;
creatorCache['Slave Auction']={};
creatorCache['Slave Auction'].affected=['gold','rep'];
creatorCache['Slave Auction'].canStart={};
creatorCache['Slave Auction'].canStart.game=\`canStart() {
		let minCost = 70 + resources.reputation;
		return resources.gold >= minCost && resources.reputation < 0;
    }\`;
creatorCache['Slave Auction'].canStart.pred=\`(input) => {
        let minCost = 70 + input.rep;
		return input.gold >= minCost && input.rep < 0;
        }\`;
creatorCache['Slave Auction'].effect={};
creatorCache['Slave Auction'].effect.cost=\`cost() {
        
		let totalSlaves = towns[MERCHANTON].goodSlaveAuction + (towns[MERCHANTON].totalSlaveAuction - towns[MERCHANTON].checkedSlaveAuction);
		let costPerSlave = Math.max(60 + Math.ceil(resources.reputation/2), 10);
		
		let affordableMaxSlaves = Math.floor(resources.gold/costPerSlave);
		let costs = (Math.min(affordableMaxSlaves * costPerSlave, totalSlaves * costPerSlave)) * (-1);
		
		resetResource("reputation");
		addResource("gold", costs);
        
    }\`;
creatorCache['Slave Auction'].effect.game=\`finish() {
		
		let totalSlaves = towns[MERCHANTON].goodSlaveAuction + (towns[MERCHANTON].totalSlaveAuction - towns[MERCHANTON].checkedSlaveAuction);
		let costPerSlave = Math.max(60 + Math.ceil(resources.reputation/2), 10);
		let bounty = 75;
		
		let affordableMaxSlaves = Math.floor(resources.gold/costPerSlave);
		let numberOfLoops = Math.min(affordableMaxSlaves, totalSlaves);
		
		for(let i = 0; i <= numberOfLoops; i++){
			
			towns[MERCHANTON].finishRegular(this.varName, 10, () => {
				addResource("gold", bounty);
				return bounty;
			});
		}
        
    }\`;
creatorCache['Slave Auction'].effect.pred=\`(r,k) => {

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
      }\`;
creatorCache['Adventure Guild']={};
creatorCache['Adventure Guild'].affected=['gold','adventures'];
creatorCache['Adventure Guild'].canStart={};
creatorCache['Adventure Guild'].canStart.game=\`canStart() {
        return guild === "";
    }\`;
creatorCache['Adventure Guild'].canStart.pred=\`(input) => (input.guild=='')\`;
creatorCache['Adventure Guild'].loop={};
creatorCache['Adventure Guild'].loop.cost={};
creatorCache['Adventure Guild'].loop.cost.game=\`loopCost(segment) {
        return precision3(Math.pow(1.65, towns[MERCHANTON]['@{this.varName}LoopCounter'] + segment)) * 230000;
    }\`;
creatorCache['Adventure Guild'].loop.cost.pred=\`(p) => segment =>  precision3(Math.pow(1.65, p.completed + segment)) * 230000\`;
creatorCache['Adventure Guild'].loop.tick={};
creatorCache['Adventure Guild'].loop.tick.game=\`tickProgress(offset) {
        return (getSkillLevel("Magic") / 2 + getSelfCombat("Combat") / 2) *
                Math.sqrt((1 + getLevel(this.loopStats[(towns[MERCHANTON]['@{this.varName}LoopCounter'] + offset) % this.loopStats.length]) / 100)) *
                Math.sqrt(1 + towns[MERCHANTON]['total@{this.varName}']);
    }\`;
creatorCache['Adventure Guild'].loop.tick.pred=\`(p, a, s, k, r) => offset => (h.getSelfCombat(r, k) +  getSkillLevelFromExp(k.magic) / 2) * Math.sqrt(h.getStatProgress(p, a, s, offset, 100)) * Math.sqrt(1 + p.total)\`;
creatorCache['Adventure Guild'].loop.end={};
creatorCache['Adventure Guild'].loop.end.game=\`finish() {
        guild = "Adventure";
		view.adjustExpGain(Action.TrainingFacility);
		view.adjustGoldCost("TailJudges", Action.TailJudges.goldCost());
    }\`;
creatorCache['Adventure Guild'].loop.end.pred=\`(r) => (r.guild='Adventure')\`;
creatorCache['Adventure Guild'].loop.segment={};
creatorCache['Adventure Guild'].loop.segment.game=\`segmentFinished() {
        curAdvGuildSegment++;
    }\`;
creatorCache['Adventure Guild'].loop.segment.pred=\`(r) => (r.adventures++)\`;
creatorCache['Adventure Guild'].loop.loop={};
creatorCache['Adventure Guild'].loop.loop.game=\`loopsFinished() {
		gotERankAdv = true;
    }\`;
creatorCache['Adventure Guild'].loop.loop.pred=\`\`;
creatorCache['Adventure Guild'].loop.max=\`\`;
creatorCache['Training Facility']={};
creatorCache['Training Facility'].affected=['gold','teamMembers','adventures'];
creatorCache['Training Facility'].canStart={};
creatorCache['Training Facility'].canStart.game=\`canStart() {
		let membersCheck = false;
		if(resources.teamMembers === 0 || resources.gold >= 25){
			membersCheck = true;
		}
		
		return guild === "Adventure" && membersCheck;
    }\`;
creatorCache['Training Facility'].canStart.pred=\`(input) => {
          return (input.teamMembers === 0 || input.gold >= 25) && input.guild === "Adventure"
        }\`;
creatorCache['Training Facility'].effect={};
creatorCache['Training Facility'].effect.skills={};	
creatorCache['Training Facility'].effect.skills.TeamWork=\`TeamWork() {
			let exp = 40;
			exp = exp * getAdvGuildRank().bonus;
			exp = exp * ( 1 + resources.teamMembers);
			return exp;
		}\`,
creatorCache['Training Facility'].effect.cost=\`cost() {
		if(resources.teamMembers > 0){
			addResource("gold", -25);
		}
    }\`;
creatorCache['Training Facility'].effect.game=\`finish() {
		handleSkillExp(this.skills);
    }\`;
creatorCache['Training Facility'].effect.pred=\`(r,k) => {
          if (r.teamMembers>0) {
            r.gold-=25;
          }
          let exp = 40;
		  exp = exp * h.getGuildRankBonus(r.adventures);
		  exp = exp * ( 1 + r.teamMembers);
	      k.teamwork+=exp;
        
        }\`;
creatorCache['Gather Team']={};
creatorCache['Gather Team'].affected=['teamMembers','adventures'];
creatorCache['Gather Team'].canStart={};
creatorCache['Gather Team'].canStart.game=\`canStart() {
		let teamLimit = Math.floor (getAdvGuildRank().bonus / 2);
        return guild === "Adventure" && resources.teamMembers < teamLimit;
    }\`;
creatorCache['Gather Team'].canStart.pred=\`(input) => {
		  let teamLimit = Math.floor (h.getGuildRankBonus(input.adventures) / 2);
          return input.guild === "Adventure" && input.teamMembers < teamLimit;
    }\`;
creatorCache['Gather Team'].effect={};
creatorCache['Gather Team'].effect.game=\`finish() {
        addResource("teamMembers", 1);
		view.adjustExpGain(Action.TrainingFacility);
    }\`;
creatorCache['Gather Team'].effect.pred=\`(r) => (r.teamMembers++)\`;
creatorCache['Large Dungeon']={};
creatorCache['Large Dungeon'].affected=['teamMembers','soul'];
creatorCache['Large Dungeon'].canStart={};
creatorCache['Large Dungeon'].canStart.game=\`canStart() {
        const curFloor = Math.floor((towns[this.townNum].LDungeonLoopCounter) / this.segments + 0.0000001);
        return resources.teamMembers >= 1 && curFloor < dungeons[this.dungeonNum].length;
    }\`;
creatorCache['Large Dungeon'].canStart.pred=\`(input) => (input.teamMembers>0)\`;
creatorCache['Large Dungeon'].loop={};
creatorCache['Large Dungeon'].loop.cost={};
creatorCache['Large Dungeon'].loop.cost.game=\`loopCost(segment) {
        return precision3(Math.pow(4, Math.floor((towns[this.townNum].LDungeonLoopCounter + segment) / this.segments + 0.0000001)) * 300000);
    }\`;
creatorCache['Large Dungeon'].loop.cost.pred=\`(p, a) => segment =>  precision3(Math.pow(4, Math.floor((p.completed + segment) / a.segments + .0000001)) * 300000)\`;
creatorCache['Large Dungeon'].loop.tick={};
creatorCache['Large Dungeon'].loop.tick.game=\`tickProgress(offset) {
        const floor = Math.floor((towns[this.townNum].LDungeonLoopCounter) / this.segments + 0.0000001);
        return getTeamCombat() *
            (1 + getLevel(this.loopStats[(towns[this.townNum].LDungeonLoopCounter + offset) % this.loopStats.length]) / 100) *
            Math.sqrt(1 + dungeons[this.dungeonNum][floor].completed / 100);
    }\`;
creatorCache['Large Dungeon'].loop.tick.pred=\`(p, a, s, k, r) => offset => {
            let floor = Math.floor(p.completed / a.segments + .0000001);
            return floor in  dungeons[a.dungeonNum] ? h.getTeamCombat(r, k) * h.getStatProgress(p, a, s, offset, 100) * Math.sqrt(1 +  dungeons[a.dungeonNum][floor].completed / 100) : 0;
          }\`;
creatorCache['Large Dungeon'].loop.end={};
creatorCache['Large Dungeon'].loop.end.skills={};	
creatorCache['Large Dungeon'].loop.end.skills.TeamWork=100,
creatorCache['Large Dungeon'].loop.end.game=\`finish() {
        
    }\`;
creatorCache['Large Dungeon'].loop.end.pred=\`\`;
creatorCache['Large Dungeon'].loop.loop={};
creatorCache['Large Dungeon'].loop.loop.game=\`loopsFinished() {
        const curFloor = Math.floor((towns[this.townNum].LDungeonLoopCounter) / this.segments + 0.0000001 - 1);
        finishDungeon(this.dungeonNum, curFloor, true);
		handleSkillExp(this.skills);
    }\`;
creatorCache['Large Dungeon'].loop.loop.pred=\`(r,k) => {
      r.soul +=Math.min(10,Math.floor(10 / (1 +r.teamMembers) * (1 + getSkillLevelFromExp(k.teamwork)/100)));
      k.teamwork+=100;
    }\`;
creatorCache['Large Dungeon'].loop.max=\`(a) =>  dungeons[a.dungeonNum].length\`;
creatorCache['Mock Battle']={};
creatorCache['Mock Battle'].affected=['climbingGears'];
creatorCache['Mock Battle'].canStart={};
creatorCache['Mock Battle'].canStart.game=\`canStart() {
		const curWins = Math.floor((towns[this.townNum].MockLoopCounter) / 5 + 0.0000001);
		return guild === "Adventure" && curWins < 4;
    }\`;
creatorCache['Mock Battle'].canStart.pred=\`(input) => {
          return input.guild=="Adventure";
        }\`;
creatorCache['Mock Battle'].loop={};
creatorCache['Mock Battle'].loop.cost={};
creatorCache['Mock Battle'].loop.cost.game=\`loopCost(segment) {
		const numberLoops = towns[this.townNum].MockLoopCounter / 5;
        return Math.floor(Math.pow(20, numberLoops)+ 0.0000001) * 170000;
    }\`;
creatorCache['Mock Battle'].loop.cost.pred=\`(p,a) => segment =>  Math.floor(Math.pow(20, Math.floor((p.completed + segment) / a.segments + .0000001)))*170000\`;
creatorCache['Mock Battle'].loop.tick={};
creatorCache['Mock Battle'].loop.tick.game=\`tickProgress(offset) {
        return (getSkillLevel("TeamWork")) * Math.sqrt(1 + getLevel(this.loopStats[(towns[this.townNum].MockLoopCounter + offset) % this.loopStats.length]) / 100) * Math.sqrt(1 + towns[this.townNum].totalMock / 100);
    }\`;
creatorCache['Mock Battle'].loop.tick.pred=\`(p, a, s, k, r) => offset => getSkillLevelFromExp(k.teamwork) * h.getStatProgress(p, a, s, offset, 100) * Math.sqrt(1 + p.total / 100)\`;
creatorCache['Mock Battle'].loop.end={};
creatorCache['Mock Battle'].loop.end.game=\`finish() {
			
    }\`;
creatorCache['Mock Battle'].loop.end.pred=\`\`;
creatorCache['Mock Battle'].loop.loop={};
creatorCache['Mock Battle'].loop.loop.game=\`loopsFinished() {
		addResource("climbingGears", 1);
    }\`;
creatorCache['Mock Battle'].loop.loop.pred=\`(r,k) => {r.climbingGears++}\`;
creatorCache['Mock Battle'].loop.max=\`(a) => 3\`;
creatorCache['Crafting Guild']={};
creatorCache['Crafting Guild'].affected=['gold','crafts'];
creatorCache['Crafting Guild'].canStart={};
creatorCache['Crafting Guild'].canStart.game=\`canStart() {
        return guild === "";
    }\`;
creatorCache['Crafting Guild'].canStart.pred=\`(input) => (input.guild=='')\`;
creatorCache['Crafting Guild'].loop={};
creatorCache['Crafting Guild'].loop.cost={};
creatorCache['Crafting Guild'].loop.cost.game=\`loopCost(segment) {
        return precision3(Math.pow(1.2, towns[MERCHANTON]['@{this.varName}LoopCounter'] + segment)) * 2e6;
    }\`;
creatorCache['Crafting Guild'].loop.cost.pred=\`(p) => segment =>  precision3(Math.pow(1.2, p.completed + segment)) * 2e6\`;
creatorCache['Crafting Guild'].loop.tick={};
creatorCache['Crafting Guild'].loop.tick.game=\`tickProgress(offset) {
        return (getSkillLevel("Magic") / 2 +
                getSkillLevel("Crafting")) *
                (1 + getLevel(this.loopStats[(towns[MERCHANTON]['@{this.varName}LoopCounter'] + offset) % this.loopStats.length]) / 100) *
                Math.sqrt(1 + towns[MERCHANTON]['total@{this.varName}'] / 1000);
    }\`;
creatorCache['Crafting Guild'].loop.tick.pred=\`(p, a, s, k) => offset => ( getSkillLevelFromExp(k.magic) / 2 +  getSkillLevelFromExp(k.crafting)) * h.getStatProgress(p, a, s, offset, 100) * Math.sqrt(1 + p.total / 1000)\`;
creatorCache['Crafting Guild'].loop.end={};
creatorCache['Crafting Guild'].loop.end.skills={};	
creatorCache['Crafting Guild'].loop.end.skills.Crafting=50,
creatorCache['Crafting Guild'].loop.end.game=\`finish() {
        guild = "Crafting";
        unlockStory("craftGuildTestsTaken");
		//view.adjustGoldCost("TailJudges", Action.TailJudges.goldCost());
    }\`;
creatorCache['Crafting Guild'].loop.end.pred=\`(r) => (r.guild='crafting')\`;
creatorCache['Crafting Guild'].loop.segment={};
creatorCache['Crafting Guild'].loop.segment.game=\`segmentFinished() {
        curCraftGuildSegment++;
        handleSkillExp(this.skills);
        addResource("gold", 10);
    }\`;
creatorCache['Crafting Guild'].loop.segment.pred=\`(r, k) => (r.gold += 10, r.crafts++, k.crafting += 50)\`;
creatorCache['Crafting Guild'].loop.loop={};
creatorCache['Crafting Guild'].loop.loop.game=\`loopsFinished() {
        if (curCraftGuildSegment >= 0) unlockStory("craftGuildRankEReached");
        if (curCraftGuildSegment >= 3) unlockStory("craftGuildRankDReached");
        if (curCraftGuildSegment >= 6) unlockStory("craftGuildRankCReached");
        if (curCraftGuildSegment >= 9) unlockStory("craftGuildRankBReached");
        if (curCraftGuildSegment >= 12) unlockStory("craftGuildRankAReached");
        if (curCraftGuildSegment >= 15) unlockStory("craftGuildRankSReached");
        if (curCraftGuildSegment >= 27) unlockStory("craftGuildRankUReached");
        if (curCraftGuildSegment >= 39) unlockStory("craftGuildRankGodlikeReached");
    }\`;
creatorCache['Crafting Guild'].loop.loop.pred=\`\`;
creatorCache['Crafting Guild'].loop.max=\`\`;
creatorCache['Craft Armor']={};
creatorCache['Craft Armor'].affected=['hide'];
creatorCache['Craft Armor'].canStart={};
creatorCache['Craft Armor'].canStart.game=\`canStart() {
        return resources.hide >= 2;
    }\`;
creatorCache['Craft Armor'].canStart.pred=\`(input) => (input.hide >= 2)\`;
creatorCache['Craft Armor'].effect={};
creatorCache['Craft Armor'].effect.cost=\`cost() {
        addResource("hide", -2);
    }\`;
creatorCache['Craft Armor'].effect.game=\`finish() {
        addResource("armor", 1);
        unlockStory("armorCrafted");
        if (resources.armor >= 10) unlockStory("craft10Armor");
    }\`;
creatorCache['Craft Armor'].effect.pred=\`(r) => (r.hide -= 2, r.armor = (r.armor || 0) + 1)\`;
creatorCache['Apprentice']={};
creatorCache['Apprentice'].affected=[''];
creatorCache['Apprentice'].canStart={};
creatorCache['Apprentice'].canStart.game=\`canStart() {
        return guild === "Crafting";
    }\`;
creatorCache['Apprentice'].canStart.pred=\`(input) => (input.guild=='crafting')\`;
creatorCache['Apprentice'].effect={};
creatorCache['Apprentice'].effect.skills={};	
creatorCache['Apprentice'].effect.skills.Crafting=\`Crafting() {
            return 10 * (1 + towns[MERCHANTON].getLevel("Apprentice") / 100);
        }\`,
creatorCache['Apprentice'].effect.game=\`finish() {
        towns[MERCHANTON].finishProgress(this.varName, 30 * getCraftGuildRank().bonus);
        handleSkillExp(this.skills);
        view.adjustExpGain(Action.Apprentice);
    }\`;
creatorCache['Apprentice'].effect.pred=\`(r, k) => Math.min((r.apprentice = (r.apprentice || towns[2].expApprentice) + 30 * h.getGuildRankBonus(r.crafts || 0),505000), k.crafting += 10 * (1 + h.getTownLevelFromExp(r.apprentice) / 100))\`;
creatorCache['Mason']={};
creatorCache['Mason'].affected=[''];
creatorCache['Mason'].canStart={};
creatorCache['Mason'].canStart.game=\`canStart() {
        return guild === "Crafting";
    }\`;
creatorCache['Mason'].canStart.pred=\`(input) => (input.guild=='crafting')\`;
creatorCache['Mason'].effect={};
creatorCache['Mason'].effect.skills={};	
creatorCache['Mason'].effect.skills.Crafting=\`Crafting() {
            return 20 * (1 + towns[MERCHANTON].getLevel("Mason") / 100);
        }\`,
creatorCache['Mason'].effect.game=\`finish() {
        towns[MERCHANTON].finishProgress(this.varName, 20 * getCraftGuildRank().bonus);
        handleSkillExp(this.skills);
    }\`;
creatorCache['Mason'].effect.pred=\`(r, k) => (r.mason = Math.min((r.mason || towns[2].expMason) + 20 * h.getGuildRankBonus(r.crafts || 0),505000), k.crafting += 20 * (1 + h.getTownLevelFromExp(r.mason) / 100))\`;
creatorCache['Architect']={};
creatorCache['Architect'].affected=[''];
creatorCache['Architect'].canStart={};
creatorCache['Architect'].canStart.game=\`canStart() {
        return guild === "Crafting";
    }\`;
creatorCache['Architect'].canStart.pred=\`(input) => (input.guild=='crafting')\`;
creatorCache['Architect'].effect={};
creatorCache['Architect'].effect.skills={};	
creatorCache['Architect'].effect.skills.Crafting=\`Crafting() {
            return 40 * (1 + towns[MERCHANTON].getLevel("Architect") / 100);
        }\`,
creatorCache['Architect'].effect.game=\`finish() {
        towns[MERCHANTON].finishProgress(this.varName, 10 * getCraftGuildRank().bonus);
        handleSkillExp(this.skills);
    }\`;
creatorCache['Architect'].effect.pred=\`(r, k) => Math.min((r.architect = (r.architect || towns[2].expArchitect) + 10 * h.getGuildRankBonus(r.crafts || 0),505000), k.crafting += 40 * (1 + h.getTownLevelFromExp(r.architect) / 100))\`;
creatorCache['Delivery Address']={};
creatorCache['Delivery Address'].affected=['magicFighterStrenght'];
creatorCache['Delivery Address'].effect={};
creatorCache['Delivery Address'].effect.game=\`finish() {
       magicFighterStrenght = 0;
	   upgradeAction(Action.DeliveryAddress, Action.DeliveryAddressOne);
    }\`;
creatorCache['Delivery Address'].effect.pred=\`(r,k) => {
          r.magicFighterStrenght=1;
        }\`;
creatorCache['Delivery Address One']={};
creatorCache['Delivery Address One'].affected=['magicFight','magicFighterStrenght'];
creatorCache['Delivery Address One'].effect={};
creatorCache['Delivery Address One'].effect.game=\`finish() {
		if(magicFight && magicFighterStrenght === 0) {
			magicFighterStrenght = 1;
			view.adjustGoldCost("MagicFighter", magicFighterStrenght);
			upgradeAction(Action.TrainingDummy, Action.MagicFighter);
			if(getLevelSquirrelAction("Magic Fighter") === 1) levelUpSquirrelAction("Magic Fighter");
			upgradeAction(Action.DeliveryAddressOne, Action.DeliveryAddressTwo);
		}
    }\`;
creatorCache['Delivery Address One'].effect.pred=\`(r,k) => {
          if(r.magicFight>0) r.magicFighterStrenght = 2;
        }\`;
creatorCache['Delivery Address Two']={};
creatorCache['Delivery Address Two'].affected=['magicFight','magicFighterStrenght'];
creatorCache['Delivery Address Two'].effect={};
creatorCache['Delivery Address Two'].effect.game=\`finish() {
		if(magicFight && magicFighterStrenght === 1) {
			magicFighterStrenght = 2;
			view.adjustGoldCost("MagicFighter", magicFighterStrenght);
			upgradeAction(Action.DeliveryAddressTwo, Action.DeliveryAddressThree);
		}
    }\`;
creatorCache['Delivery Address Two'].effect.pred=\`(r,k) => {
          if(r.magicFight>0) r.magicFighterStrenght = 3;
        }\`;
creatorCache['Delivery Address Three']={};
creatorCache['Delivery Address Three'].affected=['magicFight','magicFighterStrenght'];
creatorCache['Delivery Address Three'].effect={};
creatorCache['Delivery Address Three'].effect.game=\`finish() {
		if(magicFight && magicFighterStrenght === 2) {
			magicFighterStrenght = 3;
			view.adjustGoldCost("MagicFighter", magicFighterStrenght);
			upgradeAction(Action.DeliveryAddressThree, Action.DeliveryAddressFour);
		}
    }\`;
creatorCache['Delivery Address Three'].effect.pred=\`(r,k) => {
          if(r.magicFight>0) r.magicFighterStrenght = 4;
        }\`;
creatorCache['Delivery Address Four']={};
creatorCache['Delivery Address Four'].affected=['magicFight','magicFighterStrenght'];
creatorCache['Delivery Address Four'].effect={};
creatorCache['Delivery Address Four'].effect.game=\`finish() {
		if(magicFight && magicFighterStrenght === 3) {
			magicFighterStrenght = 4;
			view.adjustGoldCost("MagicFighter", magicFighterStrenght);
			upgradeAction(Action.DeliveryAddressFour, Action.DeliveryAddressFive);
		}
    }\`;
creatorCache['Delivery Address Four'].effect.pred=\`(r,k) => {
          if(r.magicFight>0) r.magicFighterStrenght = 5;
        }\`;
creatorCache['Delivery Address Five']={};
creatorCache['Delivery Address Five'].affected=['magicFight','teamMembers'];
creatorCache['Delivery Address Five'].effect={};
creatorCache['Delivery Address Five'].effect.game=\`finish() {
		if(magicFight && magicFighterStrenght === 4){
			addResource("teamMembers", 1);
			view.adjustExpGain(Action.TrainingFacility);
		}
    }\`;
creatorCache['Delivery Address Five'].effect.pred=\`(r,k) => {
          if(r.magicFight>0) r.teamMembers++;
        }\`;
creatorCache['Buy Mana Z3']={};
creatorCache['Buy Mana Z3'].affected=['mana','gold'];
creatorCache['Buy Mana Z3'].effect={};
creatorCache['Buy Mana Z3'].effect.game=\`finish() {
        addMana(resources.gold * this.goldCost());
        resetResource("gold");
    }\`;
creatorCache['Buy Mana Z3'].effect.pred=\`(r) => (r.mana += r.gold *  Action.BuyManaZ3.goldCost(), r.gold = 0)\`;
creatorCache['Sell Potions']={};
creatorCache['Sell Potions'].affected=['gold','potions','darkPotions'];
creatorCache['Sell Potions'].effect={};
creatorCache['Sell Potions'].effect.game=\`finish() {
		if(resources.potions > 0){
			addResource("gold", resources.potions * 200);
			resetResource("potions");
		}
		
		if(resources.darkPotions > 0){
			addResource("gold", resources.darkPotions * 200);
			resetResource("darkPotions");
		}
    }\`;
creatorCache['Sell Potions'].effect.pred=\`(r, k) =>  {
       r.gold += r.potions * 200+r.darkPotions*200;
       r.potions = 0;
       r.darkPotions=0;
    }\`;
creatorCache['Read Books']={};
creatorCache['Read Books'].affected=[''];
creatorCache['Read Books'].canStart={};
creatorCache['Read Books'].canStart.game=\`canStart() {
        return resources.glasses;
    }\`;
creatorCache['Read Books'].canStart.pred=\`(input) => input.glasses\`;
creatorCache['Read Books'].effect={};
creatorCache['Read Books'].effect.game=\`finish() {
        unlockStory("booksRead");
    }\`;
creatorCache['Read Books'].effect.pred=\`\`;
creatorCache['Tail Judges']={};
creatorCache['Tail Judges'].affected=[''];
creatorCache['Tail Judges'].effect={};
creatorCache['Tail Judges'].effect.game=\`finish() {
		if(guild === "Adventure"){
			towns[MERCHANTON]["totalAdvGuild"] = towns[MERCHANTON]["totalAdvGuild"] + Math.floor(Math.pow(10, Math.floor(getAdvGuildRank().bonus - 1)));
		} else if(guild === "Crafting"){
			towns[MERCHANTON]["totalCraftGuild"] = towns[MERCHANTON]["totalCraftGuild"] + Math.floor(Math.pow(10, Math.floor(getCraftGuildRank().bonus - 1)));
		} else {
			//addResource("climbingGears", 1);
			//add boat
			//but only if both have already been already taken at level 3.
		}
    }\`;
creatorCache['Tail Judges'].effect.pred=\`(r,k) => {
          //NYI
        }\`;
creatorCache['Heroes Trial']={};
creatorCache['Heroes Trial'].affected=['heroism'];
creatorCache['Heroes Trial'].canStart={};
creatorCache['Heroes Trial'].canStart.game=\`canStart() {
        return this.currentFloor() < trialFloors[this.trialNum];
    }\`;
creatorCache['Heroes Trial'].canStart.pred=\`true\`;
creatorCache['Heroes Trial'].loop={};
creatorCache['Heroes Trial'].loop.cost={};
creatorCache['Heroes Trial'].loop.cost.game=\`function(segment) {
    return precision3(Math.pow(this.floorScaling, Math.floor((towns[this.townNum]['@{this.varName}LoopCounter'] + segment) / this.segments + 0.0000001)) * this.baseScaling);
}\`;
creatorCache['Heroes Trial'].loop.cost.pred=\`(p, a) => segment => precision3(Math.pow(a.floorScaling, Math.floor((p.completed + segment) / a.segments + .0000001)) * a.baseScaling)\`;
creatorCache['Heroes Trial'].loop.tick={};
creatorCache['Heroes Trial'].loop.tick.game=\`function(offset) {
    return this.baseProgress() *
        (1 + getLevel(this.loopStats[(towns[this.townNum]['@{this.varName}LoopCounter'] + offset) % this.loopStats.length]) / 100) *
        Math.sqrt(1 + trials[this.trialNum][this.currentFloor()].completed / 200);
}\`;
creatorCache['Heroes Trial'].loop.tick.pred=\`(p, a, s, k, r) => offset => {
            const floor = Math.floor(p.completed / a.segments + .0000001);
            return floor in trials[a.trialNum] ? h.getTeamCombat(r, k) * h.getStatProgress(p, a, s, offset, 100) * Math.sqrt(1 + trials[a.trialNum][floor].completed / 200) : 0;
          }\`;
creatorCache['Heroes Trial'].loop.end={};
creatorCache['Heroes Trial'].loop.end.skills={};	
creatorCache['Heroes Trial'].loop.end.skills.Combat=500,	
creatorCache['Heroes Trial'].loop.end.skills.Pyromancy=100,	
creatorCache['Heroes Trial'].loop.end.skills.Restoration=100,
creatorCache['Heroes Trial'].loop.end.game=\`finish() {
        handleSkillExp(this.skills);
        view.updateBuff("Heroism");
        view.updateSkills();
    }\`;
creatorCache['Heroes Trial'].loop.end.pred=\`(r,k) => (k.combat+=500*(1+getBuffLevel("Heroism") * 0.02),k.pyromancy+=100*(1+getBuffLevel("Heroism") * 0.02),k.restoration+=100*(1+getBuffLevel("Heroism") * 0.02))\`;
creatorCache['Heroes Trial'].loop.loop={};
creatorCache['Heroes Trial'].loop.loop.game=\`function() {
    const finishedFloor = this.currentFloor() - 1;
    //console.log("Finished floor: " + finishedFloor + " Current Floor: " + this.currentFloor());
    trials[this.trialNum][finishedFloor].completed++;
    if (finishedFloor > trials[this.trialNum].highestFloor || trials[this.trialNum].highestFloor === undefined) trials[this.trialNum].highestFloor = finishedFloor;
    view.updateTrialInfo(this.trialNum, this.currentFloor());
    this.floorReward();
}\`;
creatorCache['Heroes Trial'].loop.loop.pred=\`(r) => (r.heroism=(r.heroism||0)+1)\`;
creatorCache['Heroes Trial'].loop.max=\`(a) => trialFloors[a.trialNum]\`;
creatorCache['Start Trek']={};
creatorCache['Start Trek'].affected=[''];
creatorCache['Start Trek'].canStart={};
creatorCache['Start Trek'].canStart.game=\`canStart() {
		return resources.climbingGears >= 1;
    }\`;
creatorCache['Start Trek'].canStart.pred=\`(input) => input.climbingGears>=1\`;
creatorCache['Start Trek'].effect={};
creatorCache['Start Trek'].effect.game=\`finish() {
        //unlockTown(MTOLYMPUS);
    }\`;
creatorCache['Start Trek'].effect.pred=\`(r) => r.town = MTOLYMPUS\`;
creatorCache['Underworld']={};
creatorCache['Underworld'].affected=['gold'];
creatorCache['Underworld'].canStart={};
creatorCache['Underworld'].canStart.game=\`canStart() {
        return resources.gold >= 500;
    }\`;
creatorCache['Underworld'].canStart.pred=\`(input)=>(input.gold>=500)\`;
creatorCache['Underworld'].effect={};
creatorCache['Underworld'].effect.cost=\`cost() {
        addResource("gold", -500)
    }\`;
creatorCache['Underworld'].effect.game=\`finish() {
        unlockTown(7);
    }\`;
creatorCache['Underworld'].effect.pred=\`(r) => (r.town = 7,r.gold-=500)\`;
creatorCache['Climb Mountain']={};
creatorCache['Climb Mountain'].affected=[''];
creatorCache['Climb Mountain'].effect={};
creatorCache['Climb Mountain'].effect.game=\`finish() {
        towns[MTOLYMPUS].finishProgress(this.varName, 100 * (resources.pickaxe ? 2 : 1));
    }\`;
creatorCache['Climb Mountain'].effect.pred=\`\`;
creatorCache['Mana Geyser']={};
creatorCache['Mana Geyser'].affected=['mana'];
creatorCache['Mana Geyser'].manaCost={};
creatorCache['Mana Geyser'].manaCost.game=\`manaCost() {
        return Math.ceil(2000 * getSkillBonus("Spatiomancy"));
    }\`;
creatorCache['Mana Geyser'].manaCost.pred=\`\`;
creatorCache['Mana Geyser'].canStart={};
creatorCache['Mana Geyser'].canStart.game=\`canStart() {
        return resources.pickaxe;
    }\`;
creatorCache['Mana Geyser'].canStart.pred=\`(input) => input.pickaxe\`;
creatorCache['Mana Geyser'].effect={};
creatorCache['Mana Geyser'].effect.game=\`finish() {
        towns[MTOLYMPUS].finishRegular(this.varName, 100, () => {
            addMana(5000);
            return 5000;
        });
    }\`;
creatorCache['Mana Geyser'].effect.pred=\`(r) => {
          r.temp9 = (r.temp9 || 0) + 1;
          r.mana += r.temp9 <= towns[3].goodGeysers ? 5000 : 0;
        }\`;
creatorCache['Decipher Runes']={};
creatorCache['Decipher Runes'].affected=[''];
creatorCache['Decipher Runes'].effect={};
creatorCache['Decipher Runes'].effect.game=\`finish() {
        towns[MTOLYMPUS].finishProgress(this.varName, 100 * (resources.glasses ? 2 : 1));
        view.adjustManaCost("Chronomancy");
        view.adjustManaCost("Pyromancy");
    }\`;
creatorCache['Decipher Runes'].effect.pred=\`\`;
creatorCache['Chronomancy']={};
creatorCache['Chronomancy'].affected=[''];
creatorCache['Chronomancy'].manaCost={};
creatorCache['Chronomancy'].manaCost.game=\`manaCost() {
        return Math.ceil(10000 * (1 - towns[MTOLYMPUS].getLevel("Runes") * 0.005));
    }\`;
creatorCache['Chronomancy'].manaCost.pred=\`\`;
creatorCache['Chronomancy'].effect={};
creatorCache['Chronomancy'].effect.skills={};	
creatorCache['Chronomancy'].effect.skills.Chronomancy=100,
creatorCache['Chronomancy'].effect.game=\`finish() {
        handleSkillExp(this.skills);
    }\`;
creatorCache['Chronomancy'].effect.pred=\`(r, k) => k.chronomancy += 100\`;
creatorCache['Looping Potion']={};
creatorCache['Looping Potion'].affected=['herbs','lpotions'];
creatorCache['Looping Potion'].manaCost={};
creatorCache['Looping Potion'].manaCost.game=\`manaCost() {
        return Math.ceil(30000);
    }\`;
creatorCache['Looping Potion'].manaCost.pred=\`\`;
creatorCache['Looping Potion'].canStart={};
creatorCache['Looping Potion'].canStart.game=\`canStart() {
        return resources.herbs >= 400;
    }\`;
creatorCache['Looping Potion'].canStart.pred=\`(input) => (input.herbs>=400)\`;
creatorCache['Looping Potion'].effect={};
creatorCache['Looping Potion'].effect.skills={};	
creatorCache['Looping Potion'].effect.skills.Alchemy=100,
creatorCache['Looping Potion'].effect.cost=\`cost() {
        addResource("herbs", -400);
    }\`;
creatorCache['Looping Potion'].effect.game=\`finish() {
        addResource("loopingPotion", true);
        handleSkillExp(this.skills);
        unlockStory("loopingPotionMade");
    }\`;
creatorCache['Looping Potion'].effect.pred=\`(r, k) => (r.herbs -= 400, r.lpotions++, k.alchemy += 100)\`;
creatorCache['Pyromancy']={};
creatorCache['Pyromancy'].affected=[''];
creatorCache['Pyromancy'].manaCost={};
creatorCache['Pyromancy'].manaCost.game=\`manaCost() {
        return Math.ceil(14000 * (1 - towns[MTOLYMPUS].getLevel("Runes") * 0.005));
    }\`;
creatorCache['Pyromancy'].manaCost.pred=\`\`;
creatorCache['Pyromancy'].effect={};
creatorCache['Pyromancy'].effect.skills={};	
creatorCache['Pyromancy'].effect.skills.Pyromancy=100,
creatorCache['Pyromancy'].effect.game=\`finish() {
        handleSkillExp(this.skills);
    }\`;
creatorCache['Pyromancy'].effect.pred=\`(r, k) => k.pyromancy += 100*(1+getBuffLevel("Heroism") * 0.02)\`;
creatorCache['Explore Cavern']={};
creatorCache['Explore Cavern'].affected=[''];
creatorCache['Explore Cavern'].effect={};
creatorCache['Explore Cavern'].effect.game=\`finish() {
        towns[MTOLYMPUS].finishProgress(this.varName, 100);
    }\`;
creatorCache['Explore Cavern'].effect.pred=\`\`;
creatorCache['Mine Soulstones']={};
creatorCache['Mine Soulstones'].affected=['soul'];
creatorCache['Mine Soulstones'].canStart={};
creatorCache['Mine Soulstones'].canStart.game=\`canStart() {
        return resources.pickaxe;
    }\`;
creatorCache['Mine Soulstones'].canStart.pred=\`(input) => input.pickaxe\`;
creatorCache['Mine Soulstones'].effect={};
creatorCache['Mine Soulstones'].effect.game=\`finish() {
        towns[MTOLYMPUS].finishRegular(this.varName, 10, () => {
            const statToAdd = statList[Math.floor(Math.random() * statList.length)];
            stats[statToAdd].soulstone +=  Math.floor(getSkillBonus("Divine"));
            view.updateSoulstones();
        });
    }\`;
creatorCache['Mine Soulstones'].effect.pred=\`(r) => {
          r.temp10 = (r.temp10 || 0) + 1;
          let ssGained = r.temp10 <= towns[3].goodMineSoulstones ? h.getRewardSS(0) : 0;
          r.nonDungeonSS = (r.nonDungeonSS || 0) + ssGained;
          r.soul += ssGained;
        }\`;
creatorCache['Hunt Trolls']={};
creatorCache['Hunt Trolls'].affected=['blood'];
creatorCache['Hunt Trolls'].loop={};
creatorCache['Hunt Trolls'].loop.cost={};
creatorCache['Hunt Trolls'].loop.cost.game=\`loopCost(segment) {
        return precision3(Math.pow(2, Math.floor((towns[this.townNum].HuntTrollsLoopCounter + segment) / this.segments + 0.0000001)) * 1e6);
    }\`;
creatorCache['Hunt Trolls'].loop.cost.pred=\`(p, a) => segment =>  precision3(Math.pow(2, Math.floor((p.completed + segment) / a.segments+.0000001)) * 1e6)\`;
creatorCache['Hunt Trolls'].loop.tick={};
creatorCache['Hunt Trolls'].loop.tick.game=\`tickProgress(offset) {
        return (getSelfCombat() * (1 + getLevel(this.loopStats[(towns[MTOLYMPUS].HuntTrollsLoopCounter + offset) % this.loopStats.length]) / 100) * Math.sqrt(1 + towns[MTOLYMPUS].totalHuntTrolls / 100));
    }\`;
creatorCache['Hunt Trolls'].loop.tick.pred=\`(p, a, s, k, r) => offset => (h.getSelfCombat(r, k) * Math.sqrt(1 + p.total/100) * (1 +  getLevelFromExp(s[a.loopStats[(p.completed + offset) % a.loopStats.length]])/100))\`;
creatorCache['Hunt Trolls'].loop.end={};
creatorCache['Hunt Trolls'].loop.end.skills={};	
creatorCache['Hunt Trolls'].loop.end.skills.Combat=1000,
creatorCache['Hunt Trolls'].loop.end.game=\`finish() {
        //handleSkillExp(this.skills);
    }\`;
creatorCache['Hunt Trolls'].loop.end.pred=\`\`;
creatorCache['Hunt Trolls'].loop.segment={};
creatorCache['Hunt Trolls'].loop.segment.game=\`segmentFinished() {
        handleSkillExp(this.skills);
    }\`;
creatorCache['Hunt Trolls'].loop.segment.pred=\`(r,k) => (k.combat += 1000*(1+getBuffLevel("Heroism") * 0.02))\`;
creatorCache['Hunt Trolls'].loop.loop={};
creatorCache['Hunt Trolls'].loop.loop.game=\`loopsFinished() {
        handleSkillExp(this.skills);
        addResource("blood", 1);
        if (resources.blood >= 10) unlockStory("slay10TrollsInALoop");
    }\`;
creatorCache['Hunt Trolls'].loop.loop.pred=\`(r, k) => (r.blood++, k.combat += 1000*(1+getBuffLevel("Heroism") * 0.02))\`;
creatorCache['Hunt Trolls'].loop.max=\`\`;
creatorCache['Check Walls']={};
creatorCache['Check Walls'].affected=[''];
creatorCache['Check Walls'].effect={};
creatorCache['Check Walls'].effect.game=\`finish() {
        towns[MTOLYMPUS].finishProgress(this.varName, 100);
    }\`;
creatorCache['Check Walls'].effect.pred=\`\`;
creatorCache['Take Artifacts']={};
creatorCache['Take Artifacts'].affected=['artifacts'];
creatorCache['Take Artifacts'].effect={};
creatorCache['Take Artifacts'].effect.game=\`finish() {
        towns[MTOLYMPUS].finishRegular(this.varName, 25, () => {
            addResource("artifacts", 1);
        });
    }\`;
creatorCache['Take Artifacts'].effect.pred=\`(r) => {
          r.temp11 = (r.temp11 || 0) + 1;
          r.artifacts += r.temp11 <= towns[3].goodArtifacts ? 1 : 0;
        }\`;
creatorCache['Imbue Mind']={};
creatorCache['Imbue Mind'].affected=['mind'];
creatorCache['Imbue Mind'].canStart={};
creatorCache['Imbue Mind'].canStart.game=\`canStart() {
        return towns[MTOLYMPUS].ImbueMindLoopCounter === 0 && checkSoulstoneSac(this.goldCost()) && getBuffLevel("Imbuement") < parseInt(document.getElementById("buffImbuementCap").value);
    }\`;
creatorCache['Imbue Mind'].canStart.pred=\`true\`;
creatorCache['Imbue Mind'].loop={};
creatorCache['Imbue Mind'].loop.cost={};
creatorCache['Imbue Mind'].loop.cost.game=\`loopCost(segment) {
        return 100000000 * (segment * 5 + 1);
    }\`;
creatorCache['Imbue Mind'].loop.cost.pred=\`(p) => segment => 100000000 * (segment * 5 + 1)\`;
creatorCache['Imbue Mind'].loop.tick={};
creatorCache['Imbue Mind'].loop.tick.game=\`tickProgress(offset) {
        return getSkillLevel("Magic") * (1 + getLevel(this.loopStats[(towns[MTOLYMPUS].ImbueMindLoopCounter + offset) % this.loopStats.length]) / 100);
    }\`;
creatorCache['Imbue Mind'].loop.tick.pred=\`(p, a, s, k) => offset => {
            let attempt = Math.floor(p.completed / a.segments + .0000001);

            return attempt < 1 ? ( getSkillLevelFromExp(k.magic) * h.getStatProgress(p, a, s, offset, 100)) : 0;
          }\`;
creatorCache['Imbue Mind'].loop.end={};
creatorCache['Imbue Mind'].loop.end.game=\`finish() {
        view.updateBuff("Imbuement");
        if (options.autoMaxTraining) capAllTraining();
        if (towns[MTOLYMPUS].ImbueMindLoopCounter >= 0) unlockStory("imbueMindThirdSegmentReached");
    }\`;
creatorCache['Imbue Mind'].loop.end.pred=\`\`;
creatorCache['Imbue Mind'].loop.loop={};
creatorCache['Imbue Mind'].loop.loop.game=\`loopsFinished() {
        sacrificeSoulstones(this.goldCost());
        trainingLimits++;
        addBuffAmt("Imbuement", 1);
        view.updateSoulstones();
        view.adjustGoldCost("ImbueMind", this.goldCost());
    }\`;
creatorCache['Imbue Mind'].loop.loop.pred=\`(r) => r.mind++\`;
creatorCache['Imbue Mind'].loop.max=\`() => 1\`;
creatorCache['Imbue Body']={};
creatorCache['Imbue Body'].affected=['body'];
creatorCache['Imbue Body'].canStart={};
creatorCache['Imbue Body'].canStart.game=\`canStart() {
        let tempCanStart = true;
        for (const stat in stats) {
            if (getTalent(stat) < getBuffLevel("Imbuement2") + 1) tempCanStart = false;
        }
        return towns[MTOLYMPUS].ImbueBodyLoopCounter === 0 && (getBuffLevel("Imbuement") > getBuffLevel("Imbuement2")) && tempCanStart;
    }\`;
creatorCache['Imbue Body'].canStart.pred=\`true\`;
creatorCache['Imbue Body'].loop={};
creatorCache['Imbue Body'].loop.cost={};
creatorCache['Imbue Body'].loop.cost.game=\`loopCost(segment) {
        return 100000000 * (segment * 5 + 1);
    }\`;
creatorCache['Imbue Body'].loop.cost.pred=\`(p) => segment => 100000000 * (segment * 5 + 1)\`;
creatorCache['Imbue Body'].loop.tick={};
creatorCache['Imbue Body'].loop.tick.game=\`tickProgress(offset) {
        return getSkillLevel("Magic") * (1 + getLevel(this.loopStats[(towns[MTOLYMPUS].ImbueBodyLoopCounter + offset) % this.loopStats.length]) / 100);
    }\`;
creatorCache['Imbue Body'].loop.tick.pred=\`(p, a, s, k) => offset => {
            let attempt = Math.floor(p.completed / a.segments + .0000001);

            return attempt < 1 ? ( getSkillLevelFromExp(k.magic) * h.getStatProgress(p, a, s, offset, 100)) : 0;
          }\`;
creatorCache['Imbue Body'].loop.end={};
creatorCache['Imbue Body'].loop.end.game=\`finish() {
        view.updateBuff("Imbuement2");
    }\`;
creatorCache['Imbue Body'].loop.end.pred=\`\`;
creatorCache['Imbue Body'].loop.loop={};
creatorCache['Imbue Body'].loop.loop.game=\`loopsFinished() {
        for (const stat in stats) {
            let targetTalentLevel = getTalent(stat) - getBuffLevel("Imbuement2") - 1;
            stats[stat].talent = getExpOfLevel(targetTalentLevel); 
        }
        view.updateStats();
        addBuffAmt("Imbuement2", 1);
        view.adjustGoldCost("ImbueBody", this.goldCost());
    }\`;
creatorCache['Imbue Body'].loop.loop.pred=\`(r) => r.body++\`;
creatorCache['Imbue Body'].loop.max=\`() => 1\`;
creatorCache['Face Judgement']={};
creatorCache['Face Judgement'].affected=[''];
creatorCache['Face Judgement'].effect={};
creatorCache['Face Judgement'].effect.game=\`finish() {
        unlockStory("judgementFaced");
        if (resources.reputation >= 50) {
            unlockStory("acceptedIntoValhalla");
            unlockTown(4);
        } else if (resources.reputation <= -50) {
            unlockStory("castIntoShadowRealm");
            unlockTown(5);
        }
    }\`;
creatorCache['Face Judgement'].effect.pred=\`(r) => (r.town = r.rep>=50?4:(r.rep<=-50?5:r.town))\`;
creatorCache['Guru']={};
creatorCache['Guru'].affected=['herbs'];
creatorCache['Guru'].canStart={};
creatorCache['Guru'].canStart.game=\`canStart() {
        return resources.herbs >= 1000;
    }\`;
creatorCache['Guru'].canStart.pred=\`(input)=>(input.herbs>=1000)\`;
creatorCache['Guru'].effect={};
creatorCache['Guru'].effect.cost=\`cost() {
        addResource("herbs", -1000);
    }\`;
creatorCache['Guru'].effect.game=\`finish() {
        unlockTown(4);
    }\`;
creatorCache['Guru'].effect.pred=\`(r) => (r.town = 4,r.herbs-=1000)\`;
creatorCache['Guided Tour']={};
creatorCache['Guided Tour'].affected=['gold'];
creatorCache['Guided Tour'].canStart={};
creatorCache['Guided Tour'].canStart.game=\`canStart() {
        return resources.gold >= 10;
    }\`;
creatorCache['Guided Tour'].canStart.pred=\`(input) => {
          return (input.gold >= 10);
        }\`;
creatorCache['Guided Tour'].effect={};
creatorCache['Guided Tour'].effect.cost=\`cost() {
        addResource("gold", -10);
    }\`;
creatorCache['Guided Tour'].effect.game=\`finish() {
        towns[VALHALLA].finishProgress(this.varName, 100 * (resources.glasses ? 2 : 1));
    }\`;
creatorCache['Guided Tour'].effect.pred=\`(r,k)=>(r.gold -= 10)\`;
creatorCache['Canvass']={};
creatorCache['Canvass'].affected=[''];
creatorCache['Canvass'].effect={};
creatorCache['Canvass'].effect.game=\`finish() {
        towns[VALHALLA].finishProgress(this.varName, 50);
    }\`;
creatorCache['Canvass'].effect.pred=\`\`;
creatorCache['Donate']={};
creatorCache['Donate'].affected=['gold','rep'];
creatorCache['Donate'].canStart={};
creatorCache['Donate'].canStart.game=\`canStart() {
        return resources.gold >= 20;
    }\`;
creatorCache['Donate'].canStart.pred=\`(input) => {
          return (input.gold >= 20);
        }\`;
creatorCache['Donate'].effect={};
creatorCache['Donate'].effect.game=\`finish() {
        addResource("gold", -20);
        addResource("reputation", 1);
    }\`;
creatorCache['Donate'].effect.pred=\`(r) => {
          r.gold -= 20;
          r.rep += 1;
        }\`;
creatorCache['Accept Donations']={};
creatorCache['Accept Donations'].affected=['gold','rep'];
creatorCache['Accept Donations'].canStart={};
creatorCache['Accept Donations'].canStart.game=\`canStart() {
        return resources.reputation > 0;
    }\`;
creatorCache['Accept Donations'].canStart.pred=\`(input) => {
          return (input.rep > 0);
        }\`;
creatorCache['Accept Donations'].effect={};
creatorCache['Accept Donations'].effect.cost=\`cost() {
        addResource("reputation", -1);
    }\`;
creatorCache['Accept Donations'].effect.game=\`finish() {
        towns[VALHALLA].finishRegular(this.varName, 5, () => {
            addResource("gold", 20);
            return 20;
        });
    }\`;
creatorCache['Accept Donations'].effect.pred=\`(r) => {
          r.donateLoot = (r.donateLoot || 0) + 1;
          if (r.donateLoot<=towns[4].goodDonations) {
            r.gold += 20;
          }
          r.rep -= 1;
        }\`;
creatorCache['Tidy Up']={};
creatorCache['Tidy Up'].affected=['gold','rep'];
creatorCache['Tidy Up'].loop={};
creatorCache['Tidy Up'].loop.cost={};
creatorCache['Tidy Up'].loop.cost.game=\`loopCost(segment) {
        return fibonacci(Math.floor((towns[VALHALLA].TidyLoopCounter + segment) - towns[VALHALLA].TidyLoopCounter / 3 + 0.0000001)) * 1000000; // Temp.
    }\`;
creatorCache['Tidy Up'].loop.cost.pred=\`(p, a) => segment =>  fibonacci(Math.floor((p.completed + segment) - p.completed / 3 + .0000001)) * 1000000\`;
creatorCache['Tidy Up'].loop.tick={};
creatorCache['Tidy Up'].loop.tick.game=\`tickProgress(offset) {
        return (1 + getLevel(this.loopStats[(towns[VALHALLA].TidyLoopCounter + offset) % this.loopStats.length]) / 100) * Math.sqrt(1 + towns[VALHALLA].totalTidy / 100);
    }\`;
creatorCache['Tidy Up'].loop.tick.pred=\`(p, a, s, k) => offset =>  h.getStatProgress(p, a, s, offset, 100) * Math.sqrt(1 + p.total / 100)\`;
creatorCache['Tidy Up'].loop.end={};
creatorCache['Tidy Up'].loop.end.game=\`finish(){
        // empty
    }\`;
creatorCache['Tidy Up'].loop.end.pred=\`\`;
creatorCache['Tidy Up'].loop.segment={};
creatorCache['Tidy Up'].loop.segment.game=\`segmentFinished() {
        // empty.
    }\`;
creatorCache['Tidy Up'].loop.segment.pred=\`\`;
creatorCache['Tidy Up'].loop.loop={};
creatorCache['Tidy Up'].loop.loop.game=\`loopsFinished() {
        addResource("reputation", 1);
        addResource("gold", 5);
    }\`;
creatorCache['Tidy Up'].loop.loop.pred=\`(r) => {
              r.gold += 5;
              r.rep += 1;
            }\`;
creatorCache['Tidy Up'].loop.max=\`\`;
creatorCache['Buy Mana Z5']={};
creatorCache['Buy Mana Z5'].affected=['mana','gold'];
creatorCache['Buy Mana Z5'].canStart={};
creatorCache['Buy Mana Z5'].canStart.game=\`canStart() {
        return !portalUsed;
    }\`;
creatorCache['Buy Mana Z5'].canStart.pred=\`true\`;
creatorCache['Buy Mana Z5'].effect={};
creatorCache['Buy Mana Z5'].effect.game=\`finish() {
        addMana(resources.gold * this.goldCost());
        resetResource("gold");
    }\`;
creatorCache['Buy Mana Z5'].effect.pred=\`(r) => (r.mana += r.gold *  Action.BuyManaZ5.goldCost(), r.gold = 0)\`;
creatorCache['Sell Artifact']={};
creatorCache['Sell Artifact'].affected=['gold','artifacts'];
creatorCache['Sell Artifact'].canStart={};
creatorCache['Sell Artifact'].canStart.game=\`canStart() {
        return resources.artifacts >= 1;
    }\`;
creatorCache['Sell Artifact'].canStart.pred=\`(input) => {
          return (input.artifacts >= 1);
        }\`;
creatorCache['Sell Artifact'].effect={};
creatorCache['Sell Artifact'].effect.cost=\`cost() {
        addResource("artifacts", -1);
    }\`;
creatorCache['Sell Artifact'].effect.game=\`finish() {
        addResource("gold", 50);
    }\`;
creatorCache['Sell Artifact'].effect.pred=\`(r) => {
          r.gold += 50;
          r.artifacts -= 1;
        }\`;
creatorCache['Gift Artifact']={};
creatorCache['Gift Artifact'].affected=['artifacts'];
creatorCache['Gift Artifact'].canStart={};
creatorCache['Gift Artifact'].canStart.game=\`canStart() {
        return resources.artifacts >= 1;
    }\`;
creatorCache['Gift Artifact'].canStart.pred=\`(input) => {
          return (input.artifacts >= 1);
        }\`;
creatorCache['Gift Artifact'].effect={};
creatorCache['Gift Artifact'].effect.cost=\`cost() {
        addResource("artifacts", -1);
    }\`;
creatorCache['Gift Artifact'].effect.game=\`finish() {
        addResource("favors", 1);
    }\`;
creatorCache['Gift Artifact'].effect.pred=\`(r) => {
          r.artifacts -= 1;
          r.favor += 1;
        }\`;
creatorCache['Mercantilism']={};
creatorCache['Mercantilism'].affected=[''];
creatorCache['Mercantilism'].canStart={};
creatorCache['Mercantilism'].canStart.game=\`canStart() {
        return resources.reputation > 0;
    }\`;
creatorCache['Mercantilism'].canStart.pred=\`(input) => (input.rep > 0)\`;
creatorCache['Mercantilism'].effect={};
creatorCache['Mercantilism'].effect.skills={};	
creatorCache['Mercantilism'].effect.skills.Mercantilism=100,
creatorCache['Mercantilism'].effect.cost=\`cost() {
        addResource("reputation", -1);
    }\`;
creatorCache['Mercantilism'].effect.game=\`finish() {
        handleSkillExp(this.skills);
        view.adjustManaCost("Buy Mana Z1");
        view.adjustManaCost("Buy Mana Z3");
        view.adjustManaCost("Buy Mana Z5");
    }\`;
creatorCache['Mercantilism'].effect.pred=\`(r, k) => {
          k.mercantilism += 100;
          r.rep--;
        }\`;
creatorCache['Charm School']={};
creatorCache['Charm School'].affected=[''];
creatorCache['Charm School'].effect={};
creatorCache['Charm School'].effect.game=\`finish() {
        // empty
    }\`;
creatorCache['Charm School'].effect.pred=\`\`;
creatorCache['Oracle']={};
creatorCache['Oracle'].affected=[''];
creatorCache['Oracle'].effect={};
creatorCache['Oracle'].effect.game=\`finish() {
		
    }\`;
creatorCache['Oracle'].effect.pred=\`\`;
creatorCache['Enchant Armor']={};
creatorCache['Enchant Armor'].affected=['armor','favor','enchantments'];
creatorCache['Enchant Armor'].canStart={};
creatorCache['Enchant Armor'].canStart.game=\`canStart() {
        return resources.favors >= 1 && resources.armor >= 1;
    }\`;
creatorCache['Enchant Armor'].canStart.pred=\`(input) => {
          return (input.armor >= 0 && input.favor >= 0);
        }\`;
creatorCache['Enchant Armor'].effect={};
creatorCache['Enchant Armor'].effect.skills={};	
creatorCache['Enchant Armor'].effect.skills.Crafting=50,
creatorCache['Enchant Armor'].effect.cost=\`cost() {
        addResource("favors", -1);
        addResource("armor", -1);
    }\`;
creatorCache['Enchant Armor'].effect.game=\`finish() {
        handleSkillExp(this.skills);
        addResource("enchantments", 1);
    }\`;
creatorCache['Enchant Armor'].effect.pred=\`(r) => {
          r.armor -= 1;
          r.favor -= 1;
          r.enchantments += 1;
        }\`;
creatorCache['Wizard College']={};
creatorCache['Wizard College'].affected=['gold','favor','wizard'];
creatorCache['Wizard College'].canStart={};
creatorCache['Wizard College'].canStart.game=\`canStart() {
        return resources.gold >= 500 && resources.favors >= 10;
    }\`;
creatorCache['Wizard College'].canStart.pred=\`(input) => {
          return (input.gold >= 500 && input.favor >= 10);
        }\`;
creatorCache['Wizard College'].loop={};
creatorCache['Wizard College'].loop.cost={};
creatorCache['Wizard College'].loop.cost.game=\`loopCost(segment) {
        return precision3(Math.pow(1.3, towns[VALHALLA]['@{this.varName}LoopCounter'] + segment)) * 1e7; // Temp
    }\`;
creatorCache['Wizard College'].loop.cost.pred=\`(p) => segment =>  precision3(Math.pow(1.3, p.completed + segment)) * 1e7\`;
creatorCache['Wizard College'].loop.tick={};
creatorCache['Wizard College'].loop.tick.game=\`tickProgress(offset) {
        return (
            getSkillLevel("Magic") +
            getSkillLevel("Chronomancy") + getSkillLevel("Pyromancy") + getSkillLevel("Restoration") + getSkillLevel("Spatiomancy")) * 
            (1 + getLevel(this.loopStats[(towns[VALHALLA]['@{this.varName}LoopCounter'] + offset) % this.loopStats.length]) / 100) * 
            Math.sqrt(1 + towns[VALHALLA]['total@{this.varName}'] / 1000);
    }\`;
creatorCache['Wizard College'].loop.tick.pred=\`(p, a, s, k) => offset => ( getSkillLevelFromExp(k.magic) +
                                           getSkillLevelFromExp(k.chronomancy) +  getSkillLevelFromExp(k.pyromancy) +  getSkillLevelFromExp(k.restoration) +  getSkillLevelFromExp(k.spatiomancy)) *
                                          h.getStatProgress(p, a, s, offset, 100) * Math.sqrt(1 + p.total / 1000)\`;
creatorCache['Wizard College'].loop.end={};
creatorCache['Wizard College'].loop.end.cost=\`cost() {
        addResource("gold", -500);
        addResource("favors", -10);
    }\`;
creatorCache['Wizard College'].loop.end.game=\`finish() {
        //guild = "Wizard";
    }\`;
creatorCache['Wizard College'].loop.end.pred=\`\`;
creatorCache['Wizard College'].loop.segment={};
creatorCache['Wizard College'].loop.segment.game=\`segmentFinished() {
        curWizCollegeSegment++;
        view.adjustManaCost("Restoration");
        view.adjustManaCost("Spatiomancy");
    }\`;
creatorCache['Wizard College'].loop.segment.pred=\`(r, k) => (r.wizard++)\`;
creatorCache['Wizard College'].loop.loop={};
creatorCache['Wizard College'].loop.loop.game=\`loopsFinished() {
        // empty.
    }\`;
creatorCache['Wizard College'].loop.loop.pred=\`\`;
creatorCache['Wizard College'].loop.max=\`\`;
creatorCache['Restoration']={};
creatorCache['Restoration'].affected=[''];
creatorCache['Restoration'].manaCost={};
creatorCache['Restoration'].manaCost.game=\`manaCost() {
        return 15000 / getWizCollegeRank().bonus;
    }\`;
creatorCache['Restoration'].manaCost.pred=\`(r,k)=>(15000 / h.getWizardRankBonus(r))\`;
creatorCache['Restoration'].effect={};
creatorCache['Restoration'].effect.skills={};	
creatorCache['Restoration'].effect.skills.Restoration=100,
creatorCache['Restoration'].effect.game=\`finish() {
        handleSkillExp(this.skills);
    }\`;
creatorCache['Restoration'].effect.pred=\`(r, k) => k.restoration += 100*(1+getBuffLevel("Heroism") * 0.02)\`;
creatorCache['Spatiomancy']={};
creatorCache['Spatiomancy'].affected=[''];
creatorCache['Spatiomancy'].manaCost={};
creatorCache['Spatiomancy'].manaCost.game=\`manaCost() {
        return 20000 / getWizCollegeRank().bonus;
    }\`;
creatorCache['Spatiomancy'].manaCost.pred=\`(r,k)=>(20000 / h.getWizardRankBonus(r))\`;
creatorCache['Spatiomancy'].effect={};
creatorCache['Spatiomancy'].effect.skills={};	
creatorCache['Spatiomancy'].effect.skills.Spatiomancy=100,
creatorCache['Spatiomancy'].effect.game=\`finish() {
        handleSkillExp(this.skills);
        view.adjustManaCost("Mana Geyser");
        view.adjustManaCost("Mana Well");
        adjustAll();
        for (const action of totalActionList) {
            if (towns[action.townNum].varNames.indexOf(action.varName) !== -1) {
                view.updateRegular(action.varName, action.townNum);
            }
        }
    }\`;
creatorCache['Spatiomancy'].effect.pred=\`(r, k) => k.spatiomancy += 100\`;
creatorCache['Seek Citizenship']={};
creatorCache['Seek Citizenship'].affected=[''];
creatorCache['Seek Citizenship'].effect={};
creatorCache['Seek Citizenship'].effect.game=\`finish() {
        towns[VALHALLA].finishProgress(this.varName, 100);
    }\`;
creatorCache['Seek Citizenship'].effect.pred=\`\`;
creatorCache['Build Housing']={};
creatorCache['Build Housing'].affected=[''];
creatorCache['Build Housing'].canStart={};
creatorCache['Build Housing'].canStart.game=\`canStart() {
        let maxHouses = Math.floor(getCraftGuildRank().bonus * getSkillMod("Spatiomancy",0,500,1));
        return guild === "Crafting" && towns[VALHALLA].getLevel("Citizen") >= 100 && resources.houses < maxHouses;
    }\`;
creatorCache['Build Housing'].canStart.pred=\`(input) => {
          return (input.houses||0) < Math.floor(h.getGuildRankBonus(input.crafts || 0) * (1 + Math.min( getSkillLevelFromExp(skills.Spatiomancy.exp),500) * .01));
        }\`;
creatorCache['Build Housing'].effect={};
creatorCache['Build Housing'].effect.skills={};	
creatorCache['Build Housing'].effect.skills.Crafting=100,
creatorCache['Build Housing'].effect.game=\`finish() {
        addResource("houses", 1);
        handleSkillExp(this.skills);
    }\`;
creatorCache['Build Housing'].effect.pred=\`(r) => (r.houses = (r.houses ? r.houses+1 : 1))\`;
creatorCache['Collect Taxes']={};
creatorCache['Collect Taxes'].affected=[''];
creatorCache['Collect Taxes'].canStart={};
creatorCache['Collect Taxes'].canStart.game=\`canStart() {
        return resources.houses > 0;
    }\`;
creatorCache['Collect Taxes'].canStart.pred=\`(input) => (input.houses > 0)\`;
creatorCache['Collect Taxes'].effect={};
creatorCache['Collect Taxes'].effect.game=\`finish() {
        const goldGain = Math.floor(resources.houses * getSkillLevel("Mercantilism") / 10);
        addResource("gold", goldGain);
        return goldGain;
    }\`;
creatorCache['Collect Taxes'].effect.pred=\`(r, k) => {
          r.gold += Math.floor(r.houses *  getSkillLevelFromExp(k.mercantilism) / 10);
        }\`;
creatorCache['Pegasus']={};
creatorCache['Pegasus'].affected=['gold','favor'];
creatorCache['Pegasus'].canStart={};
creatorCache['Pegasus'].canStart.game=\`canStart() {
        return resources.gold >= 200 && resources.favors >= 20;
    }\`;
creatorCache['Pegasus'].canStart.pred=\`(input) => {
          return (input.gold >= 200 && input.favor >= 20);
        }\`;
creatorCache['Pegasus'].effect={};
creatorCache['Pegasus'].effect.cost=\`cost() {
        addResource("favors", -20);
        addResource("gold", -200);
    }\`;
creatorCache['Pegasus'].effect.game=\`finish() {
        addResource("pegasus", true);
    }\`;
creatorCache['Pegasus'].effect.pred=\`(r) => {
          r.gold -= 200;
          r.favor -= 20;
          r.pegasus = true;
        }\`;
creatorCache['Great Feast']={};
creatorCache['Great Feast'].affected=['feast'];
creatorCache['Great Feast'].canStart={};
creatorCache['Great Feast'].canStart.game=\`canStart() {
        return resources.reputation >= 100 && towns[this.townNum].GreatFeastLoopCounter === 0 && checkSoulstoneSac(this.goldCost()) && getBuffLevel("Feast") < parseInt(document.getElementById("buffFeastCap").value);
    }\`;
creatorCache['Great Feast'].canStart.pred=\`(input) => (input.rep >= 100)\`;
creatorCache['Great Feast'].loop={};
creatorCache['Great Feast'].loop.cost={};
creatorCache['Great Feast'].loop.cost.game=\`loopCost(segment) {
        return 1000000000 * (segment * 5 + 1);
    }\`;
creatorCache['Great Feast'].loop.cost.pred=\`(p) => segment => 1000000000 * (segment * 5 + 1)\`;
creatorCache['Great Feast'].loop.tick={};
creatorCache['Great Feast'].loop.tick.game=\`tickProgress(offset) {
        return (1 + getLevel(this.loopStats[(towns[VALHALLA].GreatFeastLoopCounter + offset) % this.loopStats.length]) / 100);
    }\`;
creatorCache['Great Feast'].loop.tick.pred=\`(p, a, s, k) => offset => {
            return   h.getStatProgress(p, a, s, offset, 100);
          }\`;
creatorCache['Great Feast'].loop.end={};
creatorCache['Great Feast'].loop.end.game=\`finish() {
        view.updateBuff("Feast");
    }\`;
creatorCache['Great Feast'].loop.end.pred=\`\`;
creatorCache['Great Feast'].loop.loop={};
creatorCache['Great Feast'].loop.loop.game=\`loopsFinished() {
        sacrificeSoulstones(this.goldCost());
        addBuffAmt("Feast", 1);
        view.updateSoulstones();
        view.adjustGoldCost("GreatFeast", this.goldCost());
    }\`;
creatorCache['Great Feast'].loop.loop.pred=\`(r) => r.feast++\`;
creatorCache['Great Feast'].loop.max=\`() => 1\`;
creatorCache['Fight Frost Giants']={};
creatorCache['Fight Frost Giants'].affected=[''];
creatorCache['Fight Frost Giants'].canStart={};
creatorCache['Fight Frost Giants'].canStart.game=\`canStart() {
        return resources.pegasus;
    }\`;
creatorCache['Fight Frost Giants'].canStart.pred=\`(input) => (input.pegasus)\`;
creatorCache['Fight Frost Giants'].loop={};
creatorCache['Fight Frost Giants'].loop.cost={};
creatorCache['Fight Frost Giants'].loop.cost.game=\`loopCost(segment) {
        return precision3(Math.pow(1.3, towns[VALHALLA]['@{this.varName}LoopCounter'] + segment)) * 1e7; // Temp
    }\`;
creatorCache['Fight Frost Giants'].loop.cost.pred=\`(p, a) => segment => precision3(Math.pow(1.3, (p.completed + a.segments)) * 1e7)\`;
creatorCache['Fight Frost Giants'].loop.tick={};
creatorCache['Fight Frost Giants'].loop.tick.game=\`tickProgress(offset) {
        return (getSelfCombat() * 
            (1 + getLevel(this.loopStats[(towns[VALHALLA]['@{this.varName}LoopCounter'] + offset) % this.loopStats.length]) / 100) * 
            Math.sqrt(1 + towns[VALHALLA]['total@{this.varName}'] / 1000));
    }\`;
creatorCache['Fight Frost Giants'].loop.tick.pred=\`(p, a, s, k, r) => offset => h.getSelfCombat(r, k) * Math.sqrt(1 + p.total / 1000) * h.getStatProgress(p, a, s, offset, 100)\`;
creatorCache['Fight Frost Giants'].loop.end={};
creatorCache['Fight Frost Giants'].loop.end.skills={};	
creatorCache['Fight Frost Giants'].loop.end.skills.Combat=1250,
creatorCache['Fight Frost Giants'].loop.end.game=\`finish() {
    }\`;
creatorCache['Fight Frost Giants'].loop.end.pred=\`\`;
creatorCache['Fight Frost Giants'].loop.segment={};
creatorCache['Fight Frost Giants'].loop.segment.game=\`segmentFinished() {
        curFightFrostGiantsSegment++;
        handleSkillExp(this.skills);
        // Additional thing?
    }\`;
creatorCache['Fight Frost Giants'].loop.segment.pred=\`(r,k) => (r.giants=(r.giants||0)+1 ,k.combat+=1250*(1+getBuffLevel("Heroism") * 0.02))\`;
creatorCache['Fight Frost Giants'].loop.loop={};
creatorCache['Fight Frost Giants'].loop.loop.game=\`loopsFinished() {
        handleSkillExp(this.skills);
    }\`;
creatorCache['Fight Frost Giants'].loop.loop.pred=\`(r,k) => {(k.combat += 1500*(1+getBuffLevel("Heroism") * 0.02))}\`;
creatorCache['Fight Frost Giants'].loop.max=\`\`;
creatorCache['Seek Blessing']={};
creatorCache['Seek Blessing'].affected=[''];
creatorCache['Seek Blessing'].canStart={};
creatorCache['Seek Blessing'].canStart.game=\`canStart() {
        return resources.pegasus;
    }\`;
creatorCache['Seek Blessing'].canStart.pred=\`(input) => {
          return (input.pegasus);
        }\`;
creatorCache['Seek Blessing'].effect={};
creatorCache['Seek Blessing'].effect.skills={};	
creatorCache['Seek Blessing'].effect.skills.Divine=50,
creatorCache['Seek Blessing'].effect.game=\`finish() {
        this.skills.Divine = Math.floor(50 * getFrostGiantsRank().bonus);
        handleSkillExp(this.skills);
    }\`;
creatorCache['Seek Blessing'].effect.pred=\`(r, k) => {
          k.divine+= (r.giants>62? 10: precision3(1 + 0.05 * Math.pow(r.giants||0, 1.05)) ) *50;
        }\`;
creatorCache['Fall From Grace']={};
creatorCache['Fall From Grace'].affected=[''];
creatorCache['Fall From Grace'].effect={};
creatorCache['Fall From Grace'].effect.game=\`finish() {
        if (resources.reputation >= 0) resources.reputation = -1;
        view.updateResource('reputation');
        unlockStory("fellFromGrace");
        unlockTown(5);
    }\`;
creatorCache['Fall From Grace'].effect.pred=\`(r) => {
          if (r.rep >= 0) {
            r.rep = -1;
          }
          r.town=5;
        }\`;
creatorCache['Meander']={};
creatorCache['Meander'].affected=[''];
creatorCache['Meander'].effect={};
creatorCache['Meander'].effect.game=\`finish() {
        towns[STARTINGTOWN].finishProgress(this.varName, getBuffLevel("Imbuement"));
    }\`;
creatorCache['Meander'].effect.pred=\`\`;
creatorCache['Mana Well']={};
creatorCache['Mana Well'].affected=[''];
creatorCache['Mana Well'].manaCost={};
creatorCache['Mana Well'].manaCost.game=\`manaCost() {
        return Math.ceil(2500 * getSkillBonus("Spatiomancy"));
    }\`;
creatorCache['Mana Well'].manaCost.pred=\`\`;
creatorCache['Mana Well'].canStart={};
creatorCache['Mana Well'].canStart.game=\`canStart() {
        return true;
    }\`;
creatorCache['Mana Well'].canStart.pred=\`true\`;
creatorCache['Mana Well'].effect={};
creatorCache['Mana Well'].effect.game=\`finish() {
        towns[STARTINGTOWN].finishRegular(this.varName, 100, () => {
        let wellMana = Math.max(5000 - Math.floor(10 * effectiveTime), 0);
        addMana(wellMana);
        return wellMana;
        });
    }\`;
creatorCache['Mana Well'].effect.pred=\`(r,k)=> {
            r.wellLoot = (r.wellLoot || 0) + 1;
            r.mana += r.wellLoot <= towns[5].goodWells ? Math.max(5000 - Math.floor(r.totalTicks/10),0) : 0;
          }\`;
creatorCache['Destroy Pylons']={};
creatorCache['Destroy Pylons'].affected=['pylons'];
creatorCache['Destroy Pylons'].effect={};
creatorCache['Destroy Pylons'].effect.game=\`finish() {
        towns[STARTINGTOWN].finishRegular(this.varName, 100, () => {
            addResource("pylons", 1);
            view.adjustManaCost("The Spire");
            return 1;
        });
    }\`;
creatorCache['Destroy Pylons'].effect.pred=\`(r) => {
          r.pylonLoot = (r.pylonLoot || 0) + 1;
          if (r.pylonLoot<=towns[5].goodPylons) {
            r.pylons += 1;
          }
        }\`;
creatorCache['Raise Zombie']={};
creatorCache['Raise Zombie'].affected=['blood','zombie'];
creatorCache['Raise Zombie'].canStart={};
creatorCache['Raise Zombie'].canStart.game=\`canStart() {
        return resources.blood >= 1;
    }\`;
creatorCache['Raise Zombie'].canStart.pred=\`(input) => (input.blood >= 1)\`;
creatorCache['Raise Zombie'].effect={};
creatorCache['Raise Zombie'].effect.cost=\`cost() {
        addResource("blood", -1);
    }\`;
creatorCache['Raise Zombie'].effect.game=\`finish() {
        handleSkillExp(this.skills);
        addResource("zombie", 1);
    }\`;
creatorCache['Raise Zombie'].effect.pred=\`(r) => {
            r.blood -= 1;
            r.zombie += 1;
          }\`;
creatorCache['Dark Sacrifice']={};
creatorCache['Dark Sacrifice'].affected=['blood'];
creatorCache['Dark Sacrifice'].canStart={};
creatorCache['Dark Sacrifice'].canStart.game=\`canStart() {
        return resources.blood >= 1;
    }\`;
creatorCache['Dark Sacrifice'].canStart.pred=\`(input) => (input.blood >= 1)\`;
creatorCache['Dark Sacrifice'].effect={};
creatorCache['Dark Sacrifice'].effect.skills={};	
creatorCache['Dark Sacrifice'].effect.skills.Commune=100,
creatorCache['Dark Sacrifice'].effect.cost=\`cost() {
        addResource("blood", -1);
    }\`;
creatorCache['Dark Sacrifice'].effect.game=\`finish() {
        handleSkillExp(this.skills);
        //view.adjustGoldCost("DarkRitual", Action.DarkRitual.goldCost());
    }\`;
creatorCache['Dark Sacrifice'].effect.pred=\`(r,k) => (r.blood -=1,k.commune+=100)\`;
creatorCache['The Spire']={};
creatorCache['The Spire'].affected=['soul'];
creatorCache['The Spire'].manaCost={};
creatorCache['The Spire'].manaCost.game=\`manaCost() {
        return 100000 * Math.pow(0.9,resources.pylons);
    }\`;
creatorCache['The Spire'].manaCost.pred=\`(r,k) => {
           return 100000 * Math.pow(0.9,r.pylons)
        }\`;
creatorCache['The Spire'].canStart={};
creatorCache['The Spire'].canStart.game=\`canStart() {
        const curFloor = Math.floor((towns[this.townNum].TheSpireLoopCounter) / this.segments + 0.0000001);
        return curFloor < dungeons[this.dungeonNum].length;
    }\`;
creatorCache['The Spire'].canStart.pred=\`true\`;
creatorCache['The Spire'].loop={};
creatorCache['The Spire'].loop.cost={};
creatorCache['The Spire'].loop.cost.game=\`loopCost(segment) {
        return precision3(Math.pow(2, Math.floor((towns[this.townNum].TheSpireLoopCounter + segment) / this.segments + 0.0000001)) * 1e7);
    }\`;
creatorCache['The Spire'].loop.cost.pred=\`(p, a) => segment =>  precision3(Math.pow(2, Math.floor((p.completed + segment) / a.segments + .0000001)) * 10000000)\`;
creatorCache['The Spire'].loop.tick={};
creatorCache['The Spire'].loop.tick.game=\`tickProgress(offset) {
        const floor = Math.floor((towns[this.townNum].TheSpireLoopCounter) / this.segments + 0.0000001);
        return getTeamCombat() *
        (1 + getLevel(this.loopStats[(towns[this.townNum].TheSpireLoopCounter + offset) % this.loopStats.length]) / 100) *
        Math.sqrt(1 + dungeons[this.dungeonNum][floor].completed / 200);
    }\`;
creatorCache['The Spire'].loop.tick.pred=\`(p, a, s, k, r) => offset => {
            const floor = Math.floor(p.completed / a.segments + .0000001);

            return floor in  dungeons[a.dungeonNum] ?
                h.getTeamCombat(r, k) *
                h.getStatProgress(p, a, s, offset, 100) *
                Math.sqrt(1 +  dungeons[a.dungeonNum][floor].completed / 200) : 0;
          }\`;
creatorCache['The Spire'].loop.end={};
creatorCache['The Spire'].loop.end.skills={};	
creatorCache['The Spire'].loop.end.skills.Combat=100,
creatorCache['The Spire'].loop.end.game=\`finish() {
        handleSkillExp(this.skills);
        view.updateBuff("Aspirant");
    }\`;
creatorCache['The Spire'].loop.end.pred=\`(r,k) => {(k.combat += 100*(1+getBuffLevel("Heroism") * 0.02))}\`;
creatorCache['The Spire'].loop.loop={};
creatorCache['The Spire'].loop.loop.game=\`loopsFinished() {
        const curFloor = Math.floor((towns[this.townNum].TheSpireLoopCounter) / this.segments + 0.0000001 - 1);
        finishDungeon(this.dungeonNum, curFloor);
        if (curFloor >= getBuffLevel("Aspirant")) addBuffAmt("Aspirant", 1);
    }\`;
creatorCache['The Spire'].loop.loop.pred=\`(r) => r.soul += h.getRewardSS(2)\`;
creatorCache['The Spire'].loop.max=\`(a) =>  dungeons[a.dungeonNum].length\`;
creatorCache['Purchase Supplies']={};
creatorCache['Purchase Supplies'].affected=['gold'];
creatorCache['Purchase Supplies'].canStart={};
creatorCache['Purchase Supplies'].canStart.game=\`canStart() {
        return resources.gold >= 500 && !resources.supplies;
    }\`;
creatorCache['Purchase Supplies'].canStart.pred=\`(input) => (input.gold >= 500 && input.supplies === 0)\`;
creatorCache['Purchase Supplies'].effect={};
creatorCache['Purchase Supplies'].effect.cost=\`cost() {
        addResource("gold", -500);
    }\`;
creatorCache['Purchase Supplies'].effect.game=\`finish() {
        addResource("supplies", true);
    }\`;
creatorCache['Purchase Supplies'].effect.pred=\`(r) => {
          r.gold -= 500;
          r.supplies = (r.supplies || 0) + 1;
        }\`;
creatorCache['Dead Trial']={};
creatorCache['Dead Trial'].affected=['zombie'];
creatorCache['Dead Trial'].canStart={};
creatorCache['Dead Trial'].canStart.game=\`canStart() {
        return this.currentFloor() < trialFloors[this.trialNum];
    }\`;
creatorCache['Dead Trial'].canStart.pred=\`true\`;
creatorCache['Dead Trial'].loop={};
creatorCache['Dead Trial'].loop.cost={};
creatorCache['Dead Trial'].loop.cost.game=\`function(segment) {
    return precision3(Math.pow(this.floorScaling, Math.floor((towns[this.townNum]['@{this.varName}LoopCounter'] + segment) / this.segments + 0.0000001)) * this.baseScaling);
}\`;
creatorCache['Dead Trial'].loop.cost.pred=\`(p, a) => segment => precision3(Math.pow(a.floorScaling, Math.floor((p.completed + segment) / a.segments + .0000001)) * a.baseScaling)\`;
creatorCache['Dead Trial'].loop.tick={};
creatorCache['Dead Trial'].loop.tick.game=\`function(offset) {
    return this.baseProgress() *
        (1 + getLevel(this.loopStats[(towns[this.townNum]['@{this.varName}LoopCounter'] + offset) % this.loopStats.length]) / 100) *
        Math.sqrt(1 + trials[this.trialNum][this.currentFloor()].completed / 200);
}\`;
creatorCache['Dead Trial'].loop.tick.pred=\`(p, a, s, k, r) => offset => {
            const floor = Math.floor(p.completed / a.segments + .0000001);
            return floor in trials[a.trialNum] ? h.getZombieStrength(r, k) * h.getStatProgress(p, a, s, offset, 100) * Math.sqrt(1 + trials[a.trialNum][floor].completed / 200) : 0;
          }\`;
creatorCache['Dead Trial'].loop.end={};
creatorCache['Dead Trial'].loop.end.game=\`finish() {
    }\`;
creatorCache['Dead Trial'].loop.end.pred=\`\`;
creatorCache['Dead Trial'].loop.loop={};
creatorCache['Dead Trial'].loop.loop.game=\`function() {
    const finishedFloor = this.currentFloor() - 1;
    //console.log("Finished floor: " + finishedFloor + " Current Floor: " + this.currentFloor());
    trials[this.trialNum][finishedFloor].completed++;
    if (finishedFloor > trials[this.trialNum].highestFloor || trials[this.trialNum].highestFloor === undefined) trials[this.trialNum].highestFloor = finishedFloor;
    view.updateTrialInfo(this.trialNum, this.currentFloor());
    this.floorReward();
}\`;
creatorCache['Dead Trial'].loop.loop.pred=\`(r) => (r.zombie++)\`;
creatorCache['Dead Trial'].loop.max=\`(a) => trialFloors[a.trialNum]\`;
creatorCache['Journey Forth']={};
creatorCache['Journey Forth'].affected=[''];
creatorCache['Journey Forth'].canStart={};
creatorCache['Journey Forth'].canStart.game=\`canStart() {
        return resources.supplies;
    }\`;
creatorCache['Journey Forth'].canStart.pred=\`(input) => (input.supplies >= 1)\`;
creatorCache['Journey Forth'].effect={};
creatorCache['Journey Forth'].effect.cost=\`cost() {
        addResource("supplies", false);
    }\`;
creatorCache['Journey Forth'].effect.game=\`finish() {
        unlockTown(6);
    }\`;
creatorCache['Journey Forth'].effect.pred=\`(r) => {
            r.supplies--;
            r.town=6;
        }\`;
creatorCache['Explore Jungle']={};
creatorCache['Explore Jungle'].affected=['herbs'];
creatorCache['Explore Jungle'].effect={};
creatorCache['Explore Jungle'].effect.game=\`finish() {
        towns[JUNGLEPATH].finishProgress(this.varName, 20 * getFightJungleMonstersRank().bonus);
        addResource("herbs", 1);
    }\`;
creatorCache['Explore Jungle'].effect.pred=\`(r) => (r.herbs++)\`;
creatorCache['Fight Jungle Monsters']={};
creatorCache['Fight Jungle Monsters'].affected=['hide'];
creatorCache['Fight Jungle Monsters'].canStart={};
creatorCache['Fight Jungle Monsters'].canStart.game=\`canStart() {
        return true;
    }\`;
creatorCache['Fight Jungle Monsters'].canStart.pred=\`true\`;
creatorCache['Fight Jungle Monsters'].loop={};
creatorCache['Fight Jungle Monsters'].loop.cost={};
creatorCache['Fight Jungle Monsters'].loop.cost.game=\`loopCost(segment) {
        return precision3(Math.pow(1.3, towns[JUNGLEPATH]['@{this.varName}LoopCounter'] + segment)) * 1e8; // Temp
    }\`;
creatorCache['Fight Jungle Monsters'].loop.cost.pred=\`(p, a) => segment =>  precision3(Math.pow(1.3, p.completed + segment)) * 1e8\`;
creatorCache['Fight Jungle Monsters'].loop.tick={};
creatorCache['Fight Jungle Monsters'].loop.tick.game=\`tickProgress(offset) {
        return (getSelfCombat() * 
            (1 + getLevel(this.loopStats[(towns[JUNGLEPATH]['@{this.varName}LoopCounter'] + offset) % this.loopStats.length]) / 100) * 
            Math.sqrt(1 + towns[JUNGLEPATH]['total@{this.varName}'] / 1000));
    }\`;
creatorCache['Fight Jungle Monsters'].loop.tick.pred=\`(p, a, s, k, r) => offset => h.getSelfCombat(r, k) * h.getStatProgress(p, a, s, offset, 100) *
                                             Math.sqrt(1 + p.total / 1000)\`;
creatorCache['Fight Jungle Monsters'].loop.end={};
creatorCache['Fight Jungle Monsters'].loop.end.skills={};	
creatorCache['Fight Jungle Monsters'].loop.end.skills.Combat=1500,
creatorCache['Fight Jungle Monsters'].loop.end.game=\`finish() {
    }\`;
creatorCache['Fight Jungle Monsters'].loop.end.pred=\`\`;
creatorCache['Fight Jungle Monsters'].loop.segment={};
creatorCache['Fight Jungle Monsters'].loop.segment.game=\`segmentFinished() {
        curFightJungleMonstersSegment++;
        addResource("hide", 1);
        // Additional thing?
    }\`;
creatorCache['Fight Jungle Monsters'].loop.segment.pred=\`(r) => r.hide=(r.hide||0)+1\`;
creatorCache['Fight Jungle Monsters'].loop.loop={};
creatorCache['Fight Jungle Monsters'].loop.loop.game=\`loopsFinished() {
        handleSkillExp(this.skills);
    }\`;
creatorCache['Fight Jungle Monsters'].loop.loop.pred=\`(r,k)=> (k.combat+=2000*(1+getBuffLevel("Heroism") * 0.02))\`;
creatorCache['Fight Jungle Monsters'].loop.max=\`\`;
creatorCache['Rescue Survivors']={};
creatorCache['Rescue Survivors'].affected=[''];
creatorCache['Rescue Survivors'].canStart={};
creatorCache['Rescue Survivors'].canStart.game=\`canStart() {
        return true;
    }\`;
creatorCache['Rescue Survivors'].canStart.pred=\`true\`;
creatorCache['Rescue Survivors'].loop={};
creatorCache['Rescue Survivors'].loop.cost={};
creatorCache['Rescue Survivors'].loop.cost.game=\`loopCost(segment) {
        return fibonacci(2 + Math.floor((towns[JUNGLEPATH].RescueLoopCounter + segment) / this.segments + 0.0000001)) * 5000;
    }\`;
creatorCache['Rescue Survivors'].loop.cost.pred=\`(p, a) => segment =>  fibonacci(2 + Math.floor((p.completed + segment) / a.segments + .0000001)) * 5000\`;
creatorCache['Rescue Survivors'].loop.tick={};
creatorCache['Rescue Survivors'].loop.tick.game=\`tickProgress(offset) {
        return getSkillLevel("Magic") * Math.max(getSkillLevel("Restoration") / 100, 1) * (1 + getLevel(this.loopStats[(towns[JUNGLEPATH].RescueLoopCounter + offset) % this.loopStats.length]) / 100) * Math.sqrt(1 + towns[JUNGLEPATH].totalRescue / 100);
    }\`;
creatorCache['Rescue Survivors'].loop.tick.pred=\`(p, a, s, k) => offset =>  getSkillLevelFromExp(k.magic) * Math.max( getSkillLevelFromExp(k.restoration) / 100, 1) * h.getStatProgress(p, a, s, offset, 100) * Math.sqrt(1 + p.total / 100)\`;
creatorCache['Rescue Survivors'].loop.end={};
creatorCache['Rescue Survivors'].loop.end.skills={};	
creatorCache['Rescue Survivors'].loop.end.skills.Restoration=25,
creatorCache['Rescue Survivors'].loop.end.game=\`finish() {
        handleSkillExp(this.skills);
    }\`;
creatorCache['Rescue Survivors'].loop.end.pred=\`(r,k) => { (k.restoration += 25*(1+getBuffLevel("Heroism") * 0.02))}\`;
creatorCache['Rescue Survivors'].loop.loop={};
creatorCache['Rescue Survivors'].loop.loop.game=\`loopsFinished() {
        addResource("reputation", 4);
    }\`;
creatorCache['Rescue Survivors'].loop.loop.pred=\`(r) => (r.survivor= (r.survivor||0)+1,r.rep+=4)\`;
creatorCache['Rescue Survivors'].loop.max=\`\`;
creatorCache['Prepare Buffet']={};
creatorCache['Prepare Buffet'].affected=['herbs','hide'];
creatorCache['Prepare Buffet'].canStart={};
creatorCache['Prepare Buffet'].canStart.game=\`canStart() {
        return resources.herbs >= 10 && resources.hide > 0;
    }\`;
creatorCache['Prepare Buffet'].canStart.pred=\`(input) => ((input.herbs>=10) && (input.hide>=1))\`;
creatorCache['Prepare Buffet'].effect={};
creatorCache['Prepare Buffet'].effect.skills={};	
creatorCache['Prepare Buffet'].effect.skills.Alchemy=25,	
creatorCache['Prepare Buffet'].effect.skills.Gluttony=5,
creatorCache['Prepare Buffet'].effect.cost=\`cost() {
        addResource("herbs", -10);
        addResource("hide", -1);
    }\`;
creatorCache['Prepare Buffet'].effect.game=\`finish() {
        this.skills.Gluttony = Math.floor(towns[JUNGLEPATH].RescueLoopCounter * 5);
        handleSkillExp(this.skills);
    }\`;
creatorCache['Prepare Buffet'].effect.pred=\`(r,k) => {
            r.hide-=10;
            r.blood--;
            k.gluttony+=5*r.survivor;
          }\`;
creatorCache['Totem']={};
creatorCache['Totem'].affected=['lpotions'];
creatorCache['Totem'].canStart={};
creatorCache['Totem'].canStart.game=\`canStart() {
        return resources.loopingPotion;
    }\`;
creatorCache['Totem'].canStart.pred=\`(input)=>(input.lpotions>0)\`;
creatorCache['Totem'].effect={};
creatorCache['Totem'].effect.skills={};	
creatorCache['Totem'].effect.skills.Wunderkind=100,
creatorCache['Totem'].effect.cost=\`cost() {
        addResource("loopingPotion", false);
    }\`;
creatorCache['Totem'].effect.game=\`finish() {
        handleSkillExp(this.skills);
    }\`;
creatorCache['Totem'].effect.pred=\`(r,k)=>(r.lpotions--,k.wunderkind+=100)\`;
creatorCache['Escape']={};
creatorCache['Escape'].affected=[''];
creatorCache['Escape'].canStart={};
creatorCache['Escape'].canStart.game=\`canStart() {
        return effectiveTime < 60;
    }\`;
creatorCache['Escape'].canStart.pred=\`(input) => (input.totalTicks<=100*60)\`;
creatorCache['Escape'].effect={};
creatorCache['Escape'].effect.game=\`finish() {
        unlockTown(7);
    }\`;
creatorCache['Escape'].effect.pred=\`(r) => (r.town=7)\`;
creatorCache['Open Portal']={};
creatorCache['Open Portal'].affected=[''];
creatorCache['Open Portal'].effect={};
creatorCache['Open Portal'].effect.skills={};	
creatorCache['Open Portal'].effect.skills.Restoration=2500,
creatorCache['Open Portal'].effect.game=\`finish() {
        portalUsed = true;
        handleSkillExp(this.skills);
        unlockTown(1);
    }\`;
creatorCache['Open Portal'].effect.pred=\`(r,k) => (r.town=1,k.restoration+=2500*(1+getBuffLevel("Heroism") * 0.02))\`;
creatorCache['Excursion']={};
creatorCache['Excursion'].affected=['gold'];
creatorCache['Excursion'].canStart={};
creatorCache['Excursion'].canStart.game=\`canStart() {
        return resources.gold > this.goldCost();
    }\`;
creatorCache['Excursion'].canStart.pred=\`(input) => {
          return input.gold>=(((input.guild==='thieves')) >= 0 ? 2 : 10);
        }\`;
creatorCache['Excursion'].effect={};
creatorCache['Excursion'].effect.game=\`finish() {
        towns[COMMERCEVILLE].finishProgress(this.varName, 50 * (resources.glasses ? 2 : 1));
        addResource("gold", guild === "Thieves" ? -2 : -10);
    }\`;
creatorCache['Excursion'].effect.pred=\`(r, k) => {
          r.gold -= (((r.guild==='thieves')) ? 2 : 10);
        }\`;
creatorCache['Explorers Guild']={};
creatorCache['Explorers Guild'].affected=['map','completedMap'];
creatorCache['Explorers Guild'].canStart={};
creatorCache['Explorers Guild'].canStart.game=\`canStart() {
        return guild === "";
    }\`;
creatorCache['Explorers Guild'].canStart.pred=\`(input) => (input.guild=='')\`;
creatorCache['Explorers Guild'].effect={};
creatorCache['Explorers Guild'].effect.game=\`finish() {
        if (getExploreSkill() == 0) towns[this.townNum].finishProgress("SurveyZ"+this.townNum, 100);
        guild = "Explorer";
        view.adjustGoldCost("Excursion", Action.Excursion.goldCost());
    }\`;
creatorCache['Explorers Guild'].effect.pred=\`(r,k) => {
          r.submittedMap=r.completedMap;
          r.completedMap=0;
          r.guild='explorer';
          if (r.map==0) {
            r.map=30;
          }
        }\`;
creatorCache['Thieves Guild']={};
creatorCache['Thieves Guild'].affected=['gold','thieves'];
creatorCache['Thieves Guild'].canStart={};
creatorCache['Thieves Guild'].canStart.game=\`canStart() {
        return guild === "" && resources.reputation < 0;
    }\`;
creatorCache['Thieves Guild'].canStart.pred=\`(input) => {
          return ((input.rep < 0) && (input.guild==''));
        }\`;
creatorCache['Thieves Guild'].loop={};
creatorCache['Thieves Guild'].loop.cost={};
creatorCache['Thieves Guild'].loop.cost.game=\`loopCost(segment) {
        return precision3(Math.pow(1.2, towns[COMMERCEVILLE]['@{this.varName}LoopCounter'] + segment)) * 5e8;
    }\`;
creatorCache['Thieves Guild'].loop.cost.pred=\`(p) => segment =>  precision3(Math.pow(1.2, p.completed + segment)) * 5e8\`;
creatorCache['Thieves Guild'].loop.tick={};
creatorCache['Thieves Guild'].loop.tick.game=\`tickProgress(offset) {
        return (
				getSkillLevel("Thievery")) *
                (1 + getLevel(this.loopStats[(towns[COMMERCEVILLE]['@{this.varName}LoopCounter'] + offset) % this.loopStats.length]) / 100) *
                Math.sqrt(1 + towns[COMMERCEVILLE]['total@{this.varName}'] / 1000);
    }\`;
creatorCache['Thieves Guild'].loop.tick.pred=\`(p, a, s, k, r) => offset => (getSkillLevelFromExp(k.thievery)) * h.getStatProgress(p, a, s, offset, 100) * Math.sqrt(1 + p.total / 1000)\`;
creatorCache['Thieves Guild'].loop.end={};
creatorCache['Thieves Guild'].loop.end.skills={};	
creatorCache['Thieves Guild'].loop.end.skills.Thievery=50,
creatorCache['Thieves Guild'].loop.end.game=\`finish() {
        guild = "Thieves";
        view.adjustGoldCost("Excursion", Action.Excursion.goldCost());
        handleSkillExp(this.skills);
    }\`;
creatorCache['Thieves Guild'].loop.end.pred=\`(r, k) => (r.guild='thieves',k.thievery+=50)\`;
creatorCache['Thieves Guild'].loop.segment={};
creatorCache['Thieves Guild'].loop.segment.game=\`segmentFinished() {
        curThievesGuildSegment++;
        handleSkillExp(this.skills);
        addResource("gold", 10);
    }\`;
creatorCache['Thieves Guild'].loop.segment.pred=\`(r,k) => (r.gold += 10, r.thieves=( r.thieves||0)+1,k.practical+=50,k.thievery+=50)\`;
creatorCache['Thieves Guild'].loop.loop={};
creatorCache['Thieves Guild'].loop.loop.game=\`loopsFinished() {
    }\`;
creatorCache['Thieves Guild'].loop.loop.pred=\`\`;
creatorCache['Thieves Guild'].loop.max=\`\`;
creatorCache['Pick Pockets']={};
creatorCache['Pick Pockets'].affected=[''];
creatorCache['Pick Pockets'].canStart={};
creatorCache['Pick Pockets'].canStart.game=\`canStart() {
        return guild === "Thieves";
    }\`;
creatorCache['Pick Pockets'].canStart.pred=\`(input) => (input.guild==='thieves')\`;
creatorCache['Pick Pockets'].effect={};
creatorCache['Pick Pockets'].effect.skills={};	
creatorCache['Pick Pockets'].effect.skills.Thievery=\`Thievery() {
            return 10 * (1 + towns[COMMERCEVILLE].getLevel("PickPockets") / 100);
        }\`,
creatorCache['Pick Pockets'].effect.game=\`finish() {
        towns[COMMERCEVILLE].finishProgress(this.varName, 30 * getThievesGuildRank().bonus);
        handleSkillExp(this.skills);
        view.adjustExpGain(Action.ThievesGuild);
        const goldGain = Math.floor(this.goldCost() * getThievesGuildRank().bonus);
        addResource("gold", goldGain);
        return goldGain;
    }\`;
creatorCache['Pick Pockets'].effect.pred=\`(r, k) => {
          r.gold += Math.floor(Math.floor(1 * h.getSkillBonusInc(k.thievery)) * h.getGuildRankBonus(r.thieves));
          k.thievery+=10 * (1 + towns[COMMERCEVILLE].getLevel("PickPockets") / 100);
        }\`;
creatorCache['Rob Warehouse']={};
creatorCache['Rob Warehouse'].affected=[''];
creatorCache['Rob Warehouse'].canStart={};
creatorCache['Rob Warehouse'].canStart.game=\`canStart() {
        return guild === "Thieves";
    }\`;
creatorCache['Rob Warehouse'].canStart.pred=\`(input) => (input.guild==='thieves')\`;
creatorCache['Rob Warehouse'].effect={};
creatorCache['Rob Warehouse'].effect.skills={};	
creatorCache['Rob Warehouse'].effect.skills.Thievery=\`Thievery() {
            return 20 * (1 + towns[COMMERCEVILLE].getLevel("RobWarehouse") / 100);
        }\`,
creatorCache['Rob Warehouse'].effect.game=\`finish() {
        towns[COMMERCEVILLE].finishProgress(this.varName, 20 * getThievesGuildRank().bonus);
        handleSkillExp(this.skills);
        view.adjustExpGain(Action.ThievesGuild);
        const goldGain = Math.floor(this.goldCost() * getThievesGuildRank().bonus);
        addResource("gold", goldGain);
        return goldGain;
    }\`;
creatorCache['Rob Warehouse'].effect.pred=\`(r, k) => {
          r.gold += Math.floor(Math.floor(10 * h.getSkillBonusInc(k.thievery)) * h.getGuildRankBonus(r.thieves));
          k.thievery+=20 * (1 + towns[COMMERCEVILLE].getLevel("RobWarehouse") / 100);
        }\`;
creatorCache['Insurance Fraud']={};
creatorCache['Insurance Fraud'].affected=[''];
creatorCache['Insurance Fraud'].canStart={};
creatorCache['Insurance Fraud'].canStart.game=\`canStart() {
        return guild === "Thieves";
    }\`;
creatorCache['Insurance Fraud'].canStart.pred=\`(input) => (input.guild==='thieves')\`;
creatorCache['Insurance Fraud'].effect={};
creatorCache['Insurance Fraud'].effect.skills={};	
creatorCache['Insurance Fraud'].effect.skills.Thievery=\`Thievery() {
            return 40 * (1 + towns[COMMERCEVILLE].getLevel("InsuranceFraud") / 100);
        }\`,
creatorCache['Insurance Fraud'].effect.game=\`finish() {
        towns[COMMERCEVILLE].finishProgress(this.varName, 10 * getThievesGuildRank().bonus);
        handleSkillExp(this.skills);
        view.adjustExpGain(Action.ThievesGuild);
        const goldGain = Math.floor(this.goldCost() * getThievesGuildRank().bonus);
        addResource("gold", goldGain);
        return goldGain;
    }\`;
creatorCache['Insurance Fraud'].effect.pred=\`(r, k) => {
          r.gold += Math.floor(Math.floor(100 * h.getSkillBonusInc(k.thievery)) * h.getGuildRankBonus(r.thieves));
          k.thievery+=40 * (1 + towns[COMMERCEVILLE].getLevel("InsuranceFraud") / 100);
        }\`;
creatorCache['Invest']={};
creatorCache['Invest'].affected=['gold'];
creatorCache['Invest'].canStart={};
creatorCache['Invest'].canStart.game=\`canStart() {
        return resources.gold > 0;
    }\`;
creatorCache['Invest'].canStart.pred=\`(input)=>(input.gold>0)\`;
creatorCache['Invest'].effect={};
creatorCache['Invest'].effect.skills={};	
creatorCache['Invest'].effect.skills.Mercantilism=100,
creatorCache['Invest'].effect.game=\`finish() {
        handleSkillExp(this.skills);
        goldInvested += resources.gold;
        if (goldInvested > 999999999999) goldInvested = 999999999999;
        resetResource("gold");
    }\`;
creatorCache['Invest'].effect.pred=\`(r,k)=> {
           k.mercantilism+=100;
           r.gold=0;
        }\`;
creatorCache['Collect Interest']={};
creatorCache['Collect Interest'].affected=['gold'];
creatorCache['Collect Interest'].canStart={};
creatorCache['Collect Interest'].canStart.game=\`canStart() {
        return true;
    }\`;
creatorCache['Collect Interest'].canStart.pred=\`true\`;
creatorCache['Collect Interest'].effect={};
creatorCache['Collect Interest'].effect.skills={};	
creatorCache['Collect Interest'].effect.skills.Mercantilism=50,
creatorCache['Collect Interest'].effect.game=\`finish() {
        handleSkillExp(this.skills);
        let interestGold = Math.floor(goldInvested * .001);
        addResource("gold", interestGold);
        return interestGold;
    }\`;
creatorCache['Collect Interest'].effect.pred=\`(r,k)=> {
           k.mercantilism+=50;
           r.gold+=Math.floor(goldInvested * .001);
        }\`;
creatorCache['Purchase Key']={};
creatorCache['Purchase Key'].affected=['gold'];
creatorCache['Purchase Key'].canStart={};
creatorCache['Purchase Key'].canStart.game=\`canStart() {
        return resources.gold >= 1000000 && !resources.key;
    }\`;
creatorCache['Purchase Key'].canStart.pred=\`(input)=>(input.gold>=1000000)\`;
creatorCache['Purchase Key'].effect={};
creatorCache['Purchase Key'].effect.cost=\`cost() {
        addResource("gold", -1000000);
    }\`;
creatorCache['Purchase Key'].effect.game=\`finish() {
        addResource("key", true);
    }\`;
creatorCache['Purchase Key'].effect.pred=\`(r,k)=> {
           r.gold-=1000000;
           r.key=1;
        }\`;
creatorCache['Secret Trial']={};
creatorCache['Secret Trial'].affected=['zombie'];
creatorCache['Secret Trial'].canStart={};
creatorCache['Secret Trial'].canStart.game=\`canStart() {
        return currentFloor() < trialFloors[this.trialNum];
    }\`;
creatorCache['Secret Trial'].canStart.pred=\`true\`;
creatorCache['Secret Trial'].loop={};
creatorCache['Secret Trial'].loop.cost={};
creatorCache['Secret Trial'].loop.cost.game=\`function(segment) {
    return precision3(Math.pow(this.floorScaling, Math.floor((towns[this.townNum]['@{this.varName}LoopCounter'] + segment) / this.segments + 0.0000001)) * this.baseScaling);
}\`;
creatorCache['Secret Trial'].loop.cost.pred=\`(p, a) => segment => precision3(Math.pow(a.floorScaling, Math.floor((p.completed + segment) / a.segments + .0000001)) * a.baseScaling)\`;
creatorCache['Secret Trial'].loop.tick={};
creatorCache['Secret Trial'].loop.tick.game=\`function(offset) {
    return this.baseProgress() *
        (1 + getLevel(this.loopStats[(towns[this.townNum]['@{this.varName}LoopCounter'] + offset) % this.loopStats.length]) / 100) *
        Math.sqrt(1 + trials[this.trialNum][this.currentFloor()].completed / 200);
}\`;
creatorCache['Secret Trial'].loop.tick.pred=\`(p, a, s, k, r) => offset => {
            const floor = Math.floor(p.completed / a.segments + .0000001);
            if (!p.progress) p.teamCombat = h.getTeamCombat(r, k);
            return floor in trials[a.trialNum] ?  p.teamCombat * h.getStatProgress(p, a, s, offset, 100) * Math.sqrt(1 + trials[a.trialNum][floor].completed / 200) : 0;
          }\`;
creatorCache['Secret Trial'].loop.end={};
creatorCache['Secret Trial'].loop.end.game=\`finish() {
    }\`;
creatorCache['Secret Trial'].loop.end.pred=\`\`;
creatorCache['Secret Trial'].loop.loop={};
creatorCache['Secret Trial'].loop.loop.game=\`function() {
    const finishedFloor = this.currentFloor() - 1;
    //console.log("Finished floor: " + finishedFloor + " Current Floor: " + this.currentFloor());
    trials[this.trialNum][finishedFloor].completed++;
    if (finishedFloor > trials[this.trialNum].highestFloor || trials[this.trialNum].highestFloor === undefined) trials[this.trialNum].highestFloor = finishedFloor;
    view.updateTrialInfo(this.trialNum, this.currentFloor());
    this.floorReward();
}\`;
creatorCache['Secret Trial'].loop.loop.pred=\`\`;
creatorCache['Secret Trial'].loop.max=\`(a) => trialFloors[a.trialNum]\`;
creatorCache['Leave City']={};
creatorCache['Leave City'].affected=[''];
creatorCache['Leave City'].canStart={};
creatorCache['Leave City'].canStart.game=\`canStart() {
        return resources.key;
    }\`;
creatorCache['Leave City'].canStart.pred=\`(input)=>(input.key>0)\`;
creatorCache['Leave City'].effect={};
creatorCache['Leave City'].effect.cost=\`cost() {
        addResource("key", false);
    }\`;
creatorCache['Leave City'].effect.game=\`finish() {
        unlockTown(8);
    }\`;
creatorCache['Leave City'].effect.pred=\`(r,k)=> {
           r.key=0;
           r.town=8;
        }\`;
creatorCache['Imbue Soul']={};
creatorCache['Imbue Soul'].affected=['body'];
creatorCache['Imbue Soul'].canStart={};
creatorCache['Imbue Soul'].canStart.game=\`canStart() {
        return towns[VLOLYMPUS].ImbueSoulLoopCounter === 0 && getBuffLevel("Imbuement") > 499 && getBuffLevel("Imbuement2") > 499;
    }\`;
creatorCache['Imbue Soul'].canStart.pred=\`true\`;
creatorCache['Imbue Soul'].loop={};
creatorCache['Imbue Soul'].loop.cost={};
creatorCache['Imbue Soul'].loop.cost.game=\`loopCost(segment) {
        return 100000000 * (segment * 5 + 1);
    }\`;
creatorCache['Imbue Soul'].loop.cost.pred=\`(p) => segment => 100000000 * (segment * 5 + 1)\`;
creatorCache['Imbue Soul'].loop.tick={};
creatorCache['Imbue Soul'].loop.tick.game=\`tickProgress(offset) {
        return getSkillLevel("Magic") * (1 + getLevel(this.loopStats[(towns[VLOLYMPUS].ImbueSoulLoopCounter + offset) % this.loopStats.length]) / 100);
    }\`;
creatorCache['Imbue Soul'].loop.tick.pred=\`(p, a, s, k) => offset => {
            let attempt = Math.floor(p.completed / a.segments + .0000001);

            return attempt < 1 ? ( getSkillLevelFromExp(k.magic) * h.getStatProgress(p, a, s, offset, 100)) : 0;
          }\`;
creatorCache['Imbue Soul'].loop.end={};
creatorCache['Imbue Soul'].loop.end.game=\`finish() {
        view.updateBuff("Imbuement3");
    }\`;
creatorCache['Imbue Soul'].loop.end.pred=\`\`;
creatorCache['Imbue Soul'].loop.loop={};
creatorCache['Imbue Soul'].loop.loop.game=\`loopsFinished() {
        for (const stat in stats) {
            stats[stat].talent = 0;
            stats[stat].soulstone = 0;
            view.requestUpdate("updateStat", stat);
        }
        buffs["Imbuement"].amt = 0;
        buffs["Imbuement2"].amt = 0;
        trainingLimits = 10;
        addBuffAmt("Imbuement3", 1);
        view.updateBuffs();
        view.updateStats();
    }\`;
creatorCache['Imbue Soul'].loop.loop.pred=\`(r) => r.body++\`;
creatorCache['Imbue Soul'].loop.max=\`() => 1\`;
creatorCache['Build Tower']={};
creatorCache['Build Tower'].affected=['stone'];
creatorCache['Build Tower'].canStart={};
creatorCache['Build Tower'].canStart.game=\`canStart() {
        return resources.stone;
    }\`;
creatorCache['Build Tower'].canStart.pred=\`(input)=>((input.stone||0)==1)\`;
creatorCache['Build Tower'].effect={};
creatorCache['Build Tower'].effect.game=\`finish() {
        stonesUsed[stoneLoc]++;
        //towns[stoneLoc]["checkedStonesZ" + stoneLoc] -= 1000;
        towns[this.townNum].finishProgress(this.varName, 505);
        addResource("stone", false);
        if (towns[this.townNum].getLevel(this.varName) >= 100) stonesUsed = {1:250, 3:250, 5:250, 6:250};
    }\`;
creatorCache['Build Tower'].effect.pred=\`(r,k)=>(r.stone=0)\`;
creatorCache['Gods Trial']={};
creatorCache['Gods Trial'].affected=['power'];
creatorCache['Gods Trial'].canStart={};
creatorCache['Gods Trial'].canStart.game=\`canStart() {
        return this.currentFloor() < trialFloors[this.trialNum] && resources.power < 7;
    }\`;
creatorCache['Gods Trial'].canStart.pred=\`true\`;
creatorCache['Gods Trial'].loop={};
creatorCache['Gods Trial'].loop.cost={};
creatorCache['Gods Trial'].loop.cost.game=\`function(segment) {
    return precision3(Math.pow(this.floorScaling, Math.floor((towns[this.townNum]['@{this.varName}LoopCounter'] + segment) / this.segments + 0.0000001)) * this.baseScaling);
}\`;
creatorCache['Gods Trial'].loop.cost.pred=\`(p, a) => segment => precision3(Math.pow(a.floorScaling, Math.floor((p.completed + segment) / a.segments + .0000001)) * a.baseScaling)\`;
creatorCache['Gods Trial'].loop.tick={};
creatorCache['Gods Trial'].loop.tick.game=\`function(offset) {
    return this.baseProgress() *
        (1 + getLevel(this.loopStats[(towns[this.townNum]['@{this.varName}LoopCounter'] + offset) % this.loopStats.length]) / 100) *
        Math.sqrt(1 + trials[this.trialNum][this.currentFloor()].completed / 200);
}\`;
creatorCache['Gods Trial'].loop.tick.pred=\`(p, a, s, k, r) => offset => {
            const floor = Math.floor(p.completed / a.segments + .0000001);
            return floor in trials[a.trialNum] ? h.getTeamCombat(r, k) * h.getStatProgress(p, a, s, offset, 100) * Math.sqrt(1 + trials[a.trialNum][floor].completed / 200) : 0;
          }\`;
creatorCache['Gods Trial'].loop.end={};
creatorCache['Gods Trial'].loop.end.skills={};	
creatorCache['Gods Trial'].loop.end.skills.Combat=250,	
creatorCache['Gods Trial'].loop.end.skills.Pyromancy=50,	
creatorCache['Gods Trial'].loop.end.skills.Restoration=50,
creatorCache['Gods Trial'].loop.end.game=\`finish() {
        handleSkillExp(this.skills);
        view.updateSkills();
    }\`;
creatorCache['Gods Trial'].loop.end.pred=\`(r,k) => (k.combat+=250*(1+getBuffLevel("Heroism") * 0.02),k.pyromancy+=50*(1+getBuffLevel("Heroism") * 0.02),k.restoration+=50*(1+getBuffLevel("Heroism") * 0.02))\`;
creatorCache['Gods Trial'].loop.loop={};
creatorCache['Gods Trial'].loop.loop.game=\`function() {
    const finishedFloor = this.currentFloor() - 1;
    //console.log("Finished floor: " + finishedFloor + " Current Floor: " + this.currentFloor());
    trials[this.trialNum][finishedFloor].completed++;
    if (finishedFloor > trials[this.trialNum].highestFloor || trials[this.trialNum].highestFloor === undefined) trials[this.trialNum].highestFloor = finishedFloor;
    view.updateTrialInfo(this.trialNum, this.currentFloor());
    this.floorReward();
}\`;
creatorCache['Gods Trial'].loop.loop.pred=\`(r) => {
            r.godFloor=(r.godFloor||0)+1;
            if (r.godFloor>=100) {
              r.power=1;
            }
          }\`;
creatorCache['Gods Trial'].loop.max=\`(a) => trialFloors[a.trialNum]\`;
creatorCache['Challenge Gods']={};
creatorCache['Challenge Gods'].affected=['power'];
creatorCache['Challenge Gods'].canStart={};
creatorCache['Challenge Gods'].canStart.game=\`canStart() {
        return this.currentFloor() < trialFloors[this.trialNum] && resources.power > 0 && resources.power < 8;
    }\`;
creatorCache['Challenge Gods'].canStart.pred=\`(input)=>(input.power>0)\`;
creatorCache['Challenge Gods'].loop={};
creatorCache['Challenge Gods'].loop.cost={};
creatorCache['Challenge Gods'].loop.cost.game=\`function(segment) {
    return precision3(Math.pow(this.floorScaling, Math.floor((towns[this.townNum]['@{this.varName}LoopCounter'] + segment) / this.segments + 0.0000001)) * this.baseScaling);
}\`;
creatorCache['Challenge Gods'].loop.cost.pred=\`(p, a) => segment => precision3(Math.pow(a.floorScaling, Math.floor((p.completed + segment) / a.segments + .0000001)) * a.baseScaling )\`;
creatorCache['Challenge Gods'].loop.tick={};
creatorCache['Challenge Gods'].loop.tick.game=\`function(offset) {
    return this.baseProgress() *
        (1 + getLevel(this.loopStats[(towns[this.townNum]['@{this.varName}LoopCounter'] + offset) % this.loopStats.length]) / 100) *
        Math.sqrt(1 + trials[this.trialNum][this.currentFloor()].completed / 200);
}\`;
creatorCache['Challenge Gods'].loop.tick.pred=\`(p, a, s, k, r) => offset => {
            const floor = Math.floor(p.completed / a.segments + .0000001);
            return floor in trials[a.trialNum] ? h.getSelfCombat(r, k) * h.getStatProgress(p, a, s, offset, 100) * Math.sqrt(1 + trials[a.trialNum][floor].completed / 200) : 0;
          }\`;
creatorCache['Challenge Gods'].loop.end={};
creatorCache['Challenge Gods'].loop.end.skills={};	
creatorCache['Challenge Gods'].loop.end.skills.Combat=500,
creatorCache['Challenge Gods'].loop.end.game=\`finish() {
        handleSkillExp(this.skills);
        view.updateSkills();
    }\`;
creatorCache['Challenge Gods'].loop.end.pred=\`(r,k) => (k.combat+=500*(1+getBuffLevel("Heroism") * 0.02))\`;
creatorCache['Challenge Gods'].loop.loop={};
creatorCache['Challenge Gods'].loop.loop.game=\`function() {
    const finishedFloor = this.currentFloor() - 1;
    //console.log("Finished floor: " + finishedFloor + " Current Floor: " + this.currentFloor());
    trials[this.trialNum][finishedFloor].completed++;
    if (finishedFloor > trials[this.trialNum].highestFloor || trials[this.trialNum].highestFloor === undefined) trials[this.trialNum].highestFloor = finishedFloor;
    view.updateTrialInfo(this.trialNum, this.currentFloor());
    this.floorReward();
}\`;
creatorCache['Challenge Gods'].loop.loop.pred=\`(r) => (r.power++)\`;
creatorCache['Challenge Gods'].loop.max=\`(a) => trialFloors[a.trialNum]\`;
creatorCache['Restore Time']={};
creatorCache['Restore Time'].affected=['power','rep'];
creatorCache['Restore Time'].canStart={};
creatorCache['Restore Time'].canStart.game=\`canStart() {
        return resources.power >= 8;
    }\`;
creatorCache['Restore Time'].canStart.pred=\`(input)=>(input.power>=8)\`;
creatorCache['Restore Time'].effect={};
creatorCache['Restore Time'].effect.game=\`finish() {
        addResource("reputation", 9999999);
        unlockGlobalStory(3);
    }\`;
creatorCache['Restore Time'].effect.pred=\`(r)=> (r.rep+=9999999)\`;
creatorCache['First Trial']={};
creatorCache['First Trial'].affected=[''];
creatorCache['First Trial'].canStart={};
creatorCache['First Trial'].canStart.game=\`canStart() {
        return resources.squirrel;
    }\`;
creatorCache['First Trial'].canStart.pred=\`\`;
creatorCache['First Trial'].effect={};
creatorCache['First Trial'].effect.game=\`finish() {
		
    }\`;
creatorCache['First Trial'].effect.pred=\`\`;
creatorCache['Break Loop']={};
creatorCache['Break Loop'].affected=['loopPotion'];
creatorCache['Break Loop'].canStart={};
creatorCache['Break Loop'].canStart.game=\`canStart() {
        return resources.loopPotion;
    }\`;
creatorCache['Break Loop'].canStart.pred=\`(input) => {
          return input.loopPotion
        }\`;
creatorCache['Break Loop'].effect={};
creatorCache['Break Loop'].effect.game=\`finish() {
		
    }\`;
creatorCache['Break Loop'].effect.pred=\`\`;

//END CACHE File
`); //`

