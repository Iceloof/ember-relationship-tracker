# Ember Relationship Tracker 
<a href="https://www.npmjs.com/package/ember-relationship-tracker" target="blank"><img align="center" src="https://img.shields.io/npm/v/ember-relationship-tracker" alt="Ember Relationship Tracker" height="24" /></a> <a href="https://npm-stat.com/charts.html?package=ember-relationship-tracker" target="blank"><img align="center" src="https://img.shields.io/npm/dm/ember-relationship-tracker" alt="Reuters" height="24" /></a>

**Ember Relationship Tracker** is an Ember addon designed to track changes in Ember Data relationships, such as `belongsTo` and `hasMany`. It extends the functionality of Ember Data models by overwriting methods like `hasDirtyAttributes`, `changedAttributes`, `rollbackAttributes`, and `save` to include relationship changes.


## Compatibility

* Ember.js v4.9 or above
* Ember CLI v4.9 or above
* Node.js v14 or above


## Installation

```
ember install ember-relationship-tracker
```


## Usage
To use the relationship tracker, extend your models from the BaseModel provided by the addon:
```
import TrackerModel from 'ember-relationship-tracker/models';

export default class MyModel extends TrackerModel {
  // Your model attributes and methods here
}
```
If you want to ignore the relationship tracking, add `notTracking: true`
```
	@belongsTo('type1', { async: false, inverse: 'type2', notTracking: true }) attrName;
```

## Tracking Changes
The addon overrides the following methods to include relationship changes:

- **saveInitialState**: Save initialState. Note: if model is modified and saved, you may need to manually call this function `yourmodel.saveInitialState()` to update initialState.
- **hasDirtyAttributes**: Checks if the model or any of its relationships have unsaved changes.
- **changedAttributes**: Returns an object containing the changed attributes and relationships.
- **rollbackAttributes**: Reverts the model and its relationships to their original state.
- **save**: Saves the model and its relationships.


## Contributing

See the [Contributing](CONTRIBUTING.md) guide for details.


## License

This project is licensed under the [MIT License](LICENSE.md).
