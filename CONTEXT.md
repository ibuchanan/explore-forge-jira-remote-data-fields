# Domain glossary

## Remote data field

A field whose available values, validation, and next-step behavior are decided by the remote data-field service. The Forge app renders the field and persists a confirmed answer state.

## Form state

The ordered set of answers for the remote data fields on one Jira work item. Once the work item exists, the form state is stored in the `remote-data-fields-form-state` issue property.

## Form state field

The single Forge custom field that hosts the whole remote form in Jira's create issue dialog. Its value is the form state at creation time. After the work item is created, that value is copied to the form state issue property. It is not a remote data field itself.
