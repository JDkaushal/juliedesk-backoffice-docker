class Api::V1::ClientRequestsController < Api::ApiV1Controller

  def compute_count
    params.permit!
    data = ClientRequest.compute_count(params[:user_ids], params[:team_identifiers], {
        detailed: params[:detailed].present?
    }, DateTime.parse(params[:from_date]), DateTime.parse(params[:to_date]))

    render json: {
        status: 'success',
        data: params[:detailed].present? ? data : {
            count: data
        }
    }
  end
end