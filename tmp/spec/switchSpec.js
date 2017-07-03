import {Switch} from '../build/switch.js';

describe("Switch", function() {
  beforeEach(function() {});

  it("runs a different function depending of the state of the switcher", function() {
    var search_switch = 'sku'
    var filterBySku = () => 'filtrado';
    var filterByName = () => 'filtrado por nombre';
    var searchSwitch = Switch.of([['sku', filterBySku], ['name', filterByName]]);

    //primer estado
    expect(searchSwitch.run(search_switch)).toBe('filtrado');
    //cambio de estado
    search_switch = 'name'
    expect(searchSwitch.run(search_switch)).toBe('filtrado por nombre');
  });

  it("returns a value without excecuting it, if it is not a function but is registered in the array", function() {
    var filterBySku = () => 'filtrado';
    var searchSwitch = Switch.of([['sku', filterBySku], ['name', 'filtered by name']]);
    var search_switch = 'name';
    expect(searchSwitch.run(search_switch)).toBe('filtered by name');
  });

  it("returns null if the state is not a registered option on the switcher", function() {
    var filterBySku = () => 'filtrado';
    var filterByName = () => 'filtrado por nombre';
    var searchSwitch = Switch.of([['sku', filterBySku], ['name', filterByName]]);
    var search_switch = 'papas';
    expect(searchSwitch.run(search_switch)).toBe(null);
  });
});
