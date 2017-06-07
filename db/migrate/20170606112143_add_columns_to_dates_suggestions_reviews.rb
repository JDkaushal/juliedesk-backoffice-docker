class AddColumnsToDatesSuggestionsReviews < ActiveRecord::Migration
  def change
    add_column :date_suggestions_reviews, :comment, :text
    add_column :date_suggestions_reviews, :review_full_auto_errors, :json
    add_column :date_suggestions_reviews, :review_full_auto_custom_error, :string
  end
end
