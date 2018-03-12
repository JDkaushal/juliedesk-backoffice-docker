class AddAttendeesEmailsToMessageClassification < ActiveRecord::Migration
  def change
    add_column :message_classifications, :attendees_emails, :string, array: true
    change_column_default :message_classifications, :attendees_emails, []
    add_index :message_classifications, :attendees_emails, using: :gin
  end
end
