/**
 * Settings Card is a composite component to standardize the
 * creation settings cards (panels) in the dashboard.
 */

import React, { Component } from "react";
import PropTypes from "prop-types";
import { Components, registerComponent, composeWithTracker } from "@reactioncommerce/reaction-components";
import { Reaction } from "/client/api";
import ReactComponentOrBlazeTemplate from "/imports/plugins/core/components/lib/ReactComponentOrBlazeTemplate";

class SettingsCard extends Component {
  static defaultProps = {
    showSwitch: true
  }

  static propTypes = {
    children: PropTypes.node,
    enabled: PropTypes.bool, // eslint-disable-line react/boolean-prop-naming
    expanded: PropTypes.bool, // eslint-disable-line react/boolean-prop-naming
    i18nKeyTitle: PropTypes.string,
    icon: PropTypes.string,
    name: PropTypes.string,
    onExpand: PropTypes.func,
    onSwitchChange: PropTypes.func,
    packageName: PropTypes.string,
    padded: PropTypes.bool, // eslint-disable-line react/boolean-prop-naming
    preferences: PropTypes.object,
    saveOpenStateToPreferences: PropTypes.bool, // eslint-disable-line react/boolean-prop-naming
    showSwitch: PropTypes.bool, // eslint-disable-line react/boolean-prop-naming
    template: PropTypes.any,
    title: PropTypes.string
  }

  handleSwitchChange = (event, isChecked) => {
    if (typeof this.props.onSwitchChange === "function") {
      this.props.onSwitchChange(event, isChecked, this.props.name, this);
    }
  }

  handleExpand = (event, card, name, isExpanded) => {
    if (this.props.onExpand) {
      this.props.onExpand(event, card, name, isExpanded);
    }

    if (this.props.packageName && this.props.saveOpenStateToPreferences) {
      Reaction.updateUserPreferences(this.props.packageName, "settingsCards", {
        [this.props.name]: isExpanded
      });
    }
  }

  get isExpanded() {
    if (this.props.packageName && this.props.saveOpenStateToPreferences) {
      return this.props.preferences[this.props.name];
    }

    return this.props.expanded;
  }

  renderCardBody() {
    const { template } = this.props;

    if (template) {
      return (
        <ReactComponentOrBlazeTemplate name={template} />
      );
    }

    return this.props.children;
  }

  render() {
    return (
      <Components.Card
        expandable={true}
        onExpand={this.handleExpand}
        expanded={this.isExpanded}
        name={this.props.name}
      >
        <Components.CardHeader
          i18nKeyTitle={this.props.i18nKeyTitle}
          icon={this.props.icon}
          title={this.props.title}
          showSwitch={this.props.showSwitch}
          actAsExpander={true}
          switchOn={this.props.enabled}
          switchName={this.props.name}
          expandOnSwitchOn={true}
          onSwitchChange={this.handleSwitchChange}
        />
        <Components.CardBody expandable={true} padded={this.props.padded}>
          {this.renderCardBody()}
        </Components.CardBody>
      </Components.Card>
    );
  }
}

function composer(props, onData) {
  if (props.packageName && props.saveOpenStateToPreferences) {
    const preferences = Reaction.getUserPreferences(props.packageName, "settingsCards", {});
    onData(null, { preferences });
  } else {
    onData(null, {});
  }
}

const decoratedComponent = composeWithTracker(composer)(SettingsCard);

registerComponent("SettingsCard", SettingsCard, composeWithTracker(composer));

export default decoratedComponent;
