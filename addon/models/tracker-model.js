import Model from '@ember-data/model';
import RelationshipTrackerMixin from 'ember-relationship-tracker/mixins/relationship-tracker';
import { tracked } from '@glimmer/tracking';

export default class TrackerModel extends Model.extend(RelationshipTrackerMixin) {
  @tracked initialState = {};

  async init() {
    super.init(...arguments);
    // delay to avoid relationship recursive loop
    await this.delay(500);
    this.saveInitialState();
  }

  async delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  saveInitialState() {
    // only save belongsTo and hasMany state
    this.initialState = {
      relationships: this._getRelationships()
    };
  }

  _getRelationships() {
    let relationships = {};
    this.constructor.relationshipsByName.forEach((meta, name) => {
      if (meta.kind === 'belongsTo') {
        relationships[name] = this.belongsTo(name).value();
      } else if (meta.kind === 'hasMany') {
        relationships[name] = this.hasMany(name).value()?.slice();
      }
    });

    return relationships;
  }

  get hasDirtyAttributes() {
    // get attributes changes
    let attributesChanged = super.hasDirtyAttributes;
    // get relationship changes
    let relationshipsChanged = this.initialState.relationships?Object.keys(this.initialState.relationships)?.some(key => {
      let initial = this.initialState.relationships[key];
      let current = this.get(key);
      if (Array.isArray(initial)) {
        return initial.length !== current?.slice()?.length || current?.slice()?.some((item, index) => item !== initial[index]);
      } else {
        return initial !== current;
      }
    }):false;
    return attributesChanged || relationshipsChanged;
  }

  get changedAttributes() {
    let changedAttributes = super.changedAttributes();

    Object.keys(this.initialState.relationships)?.some(key => {
      let initial = this.initialState.relationships[key];
      let current = this.get(key);
      if (Array.isArray(initial)) {
        if (initial.length !== current?.slice()?.length || current?.slice()?.some((item, index) => item !== initial[index])){
          changedAttributes[key] = [initial, current?.slice()];
        }
      } else {
        if (initial !== current) {
          changedAttributes[key] = [initial, current];
        }
      }
    });
    return changedAttributes;
  }

  rollbackAttributes() {
    // Rollback attributes using Ember Data's built-in method
    super.rollbackAttributes();

    // Rollback relationships
    if(this.initialState.relationships){
      Object.keys(this.initialState.relationships).forEach(key => {
        if (Array.isArray(this.initialState.relationships[key])) {
          let relationship = this.get(key);
          relationship.length = 0; // Clear the array
          relationship.push(...this.initialState.relationships[key]); // Use native push method
        } else {
          this.set(key, this.initialState.relationships[key]);
        }
      });
    }
  }

  save(...args) {
    return super.save(...args).then((result) => {
      // reset initial state
      this.saveInitialState();
      return result;
    });
  }
}