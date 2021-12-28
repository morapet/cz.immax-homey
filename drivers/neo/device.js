'use strict';

const { Device } = require('homey');
const { ZigBeeDevice } = require("homey-zigbeedriver");
const { debug } = require("zigbee-clusters");
const { CLUSTER } = require("zigbee-clusters")
const OnOffBoundCluster = require('../../lib/OnOffBoundCluster');
const LevelControlBoundCluster = require('../../lib/LevelControlBoundCluster');

class MyDevice extends ZigBeeDevice {

  async onNodeInit({ zclNode }) {
    this.enableDebug();

    debug(true);
    this.printNode();

    //this.registerCapability("onoff", CLUSTER.ON_OFF);
    //this.registerCapability("dim", CLUSTER.LEVEL_CONTROL);

    /*this.batteryThreshold = 20;
    this.registerCapability('alarm_battery', CLUSTER.POWER_CONFIGURATION, {
      getOpts: {
        getOnStart: true,
      },
      reportOpts: {
        configureAttributeReporting: {
          minInterval: 0, // No minimum reporting interval
          maxInterval: 60000, // Maximally every ~16 hours
          minChange: 5, // Report when value changed by 5
        },
      },
    });*/

     // Bind on/off button commands
     zclNode.endpoints[1].bind(CLUSTER.ON_OFF.NAME, new OnOffBoundCluster({
      onSetOff: this._onOffCommandHandler.bind(this, 'off'),
      onSetOn: this._onOffCommandHandler.bind(this, 'on'),
    }));

    // Bind dim button commands
    zclNode.endpoints[1].bind(CLUSTER.LEVEL_CONTROL.NAME, new LevelControlBoundCluster({
      onStep: this._stepCommandHandler.bind(this),
      onStepWithOnOff: this._stepCommandHandler.bind(this),

      onMove: this._moveCommandHandler.bind(this),
      onMoveWithOnOff: this._moveCommandHandler.bind(this),

      onStop: this._stopCommandHandler.bind(this),
      onStopWithOnOff: this._stopCommandHandler.bind(this),
    }));

    //COLOR_CONTROL
    //LEVEL_CONTROL
  }

  /**
   * Trigger a Flow based on the `type` parameter.
   * @param {'on'|'off'} type
   * @private
   */
   _onOffCommandHandler(type) {
    if (type !== 'on' && type !== 'off') throw new Error('invalid_onoff_type');
    this.triggerFlow({ id: type })
      .then(() => this.log(`flow was triggered: ${type}`))
      .catch(err => this.error(`Error: triggering flow: ${type}`, err));
  }

  /**
   * Handles `onStep` and `onStepWithOnOff` commands and triggers a Flow based on the `mode`
   * parameter.
   * @param {'up'|'down'} mode
   * @param {number} stepSize - A change of `currentLevel` in step size units.
   * @param {number} transitionTime - Time in 1/10th seconds specified performing the step
   * should take.
   * @private
   */
   _stepCommandHandler({ mode, stepSize, transitionTime }) {
    if (typeof mode === 'string') {
      this.triggerFlow({ id: `dim_${mode}` })
        .then(() => this.log('flow was triggered', `dim_${mode}`))
        .catch(err => this.error('Error: triggering flow', `dim_${mode}`, err));
    }
  }

  /**
   * Handles `onStop` and `onStopWithOnOff` commands and triggers a Flow based on the last known
   * long press move mode.
   * @private
   */
   _stopCommandHandler() {
    if (this._currentLongPress) {
      const flowId = `dim_${this._currentLongPress}_long_press`;
      this.triggerFlow({ id: flowId })
        .then(() => this.log('flow was triggered', flowId))
        .catch(err => this.error('Error: triggering flow', flowId, err));
      this._currentLongPress = null;
    }
  }

   /**
   * Stores the last known long press move mode.
   * @param {'up'|'down'} moveMode
   * @private
   */
    _moveCommandHandler({ moveMode }) {
      this._currentLongPress = moveMode;
    }

  /**
   * onAdded is called when the user adds the device, called just after pairing.
   */
  async onAdded() {
    this.log('MyDevice has been added');
  }

  /**
   * onSettings is called when the user updates the device's settings.
   * @param {object} event the onSettings event data
   * @param {object} event.oldSettings The old settings object
   * @param {object} event.newSettings The new settings object
   * @param {string[]} event.changedKeys An array of keys changed since the previous version
   * @returns {Promise<string|void>} return a custom message that will be displayed
   */
  async onSettings({ oldSettings, newSettings, changedKeys }) {
    this.log('MyDevice settings where changed');
  }

  /**
   * onRenamed is called when the user updates the device's name.
   * This method can be used this to synchronise the name to the device.
   * @param {string} name The new name
   */
  async onRenamed(name) {
    this.log('MyDevice was renamed');
  }

  /**
   * onDeleted is called when the user deleted the device.
   */
  async onDeleted() {
    this.log('MyDevice has been deleted');
  }

}

module.exports = MyDevice;
