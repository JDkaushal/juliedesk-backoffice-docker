class PerformanceController < ActionController::Base
  skip_before_filter :verify_authenticity_token

  layout false
  MO1_FILE_NAME = "random_data_1mo.txt"

  def show
    @one_mo_data = File.read(MO1_FILE_NAME)
  end

  def download_1mo
    render file: MO1_FILE_NAME
  end

  def upload
    render json: {}
  end

  def blank
    render json: {}
  end
end