import Model from '@ember-data/model';
import RelationshipTrackerMixin from 'ember-relationship-tracker/mixins/relationship-tracker';
import { tracked } from '@glimmer/tracking';

export default class TrackerModel extends Model.extend(RelationshipTrackerMixin) {
  @tracked initialState = {};

  async init() {
    super.init(...arguments);
    // delay to avoid relationship recursive loop
    await this.delay(200);
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
      if(meta.options?.notTracking){
      } else if (meta.kind === 'belongsTo') {
        relationships[name] = this.belongsTo(name).value();
      } else if (meta.kind === 'hasMany') {
        relationships[name] = this.hasMany(name).value()?.slice() || [];
      }
    });
    return relationships;
  }

  get hasOriginalDirtyAttributes() {
    return super.hasDirtyAttributes;
  }
  
  get hasDirtyAttributes() {
    // get attributes changes
    let attributesChanged = super.hasDirtyAttributes;
    // get relationship changes
    let relationshipsChanged = this.initialState.relationships?Object.keys(this.initialState.relationships)?.some(key => {
      let initial = this.initialState.relationships[key];
      let current = this.get(key);
      if (Array.isArray(current)) {
        current = this.get(key).slice() || [];
        let deleted = initial.filter(element => !current.includes(element));
        return deleted.length > 0 ? true : current?.slice()?.some((item) => item?.hasDirtyAttributes||item?.isNew||item?.isDeleted);
      } else {
        return current?.hasDirtyAttributes || current?.isNew || current?.isDeleted || initial!==current;
      }
    }):false;
    return attributesChanged || relationshipsChanged;
  }

  get changedAttributes() {
    let changedAttributes = super.changedAttributes();
    
    if(this.initialState.relationships){
      Object.keys(this.initialState.relationships)?.some(key => {
        let initial = this.initialState.relationships[key];
        let current = this.get(key);
        if (Array.isArray(current)) {
          current = this.get(key).slice() || [];
          let deleted = initial.filter(element => !current.includes(element));
          if (deleted.length > 0 || current?.slice()?.some((item) => item?.hasOriginalDirtyAttributes||item?.isNew||item?.isDeleted)){
            changedAttributes[key] = [...new Set([...deleted, ...current?.slice()?.filter((item) => item?.hasOriginalDirtyAttributes||item?.isNew||item?.isDeleted)])];
          }
        } else {
          if (current?.hasDirtyAttributes) {
            changedAttributes[key] = current?.changedAttributes;
          } else if(current?.isNew || current?.isDeleted || initial!==current) {
            changedAttributes[key] = current;
          }
        }
      });
    }
    return changedAttributes;
  }

  rollbackAttributes() {
    // Rollback attributes using Ember Data's built-in method
    super.rollbackAttributes();
    
    // Rollback relationships
    const relationships = this.initialState.relationships;
    if(relationships){
      Object.keys(relationships).forEach(key => {
        if (Array.isArray(relationships[key])) {
          let rs = this.get(key);
          rs.forEach(k => k?.rollbackAttributes());
          this.set(key,this.initialState.relationships[key]);
        } else {
          this.get(key)?.rollbackAttributes();
        }
      });
    }
  }

  save(...args) {
    return super.save(...args);
  }

}