module TemplateGeneratorHelper


  def get_wait_for_contact_template template_data
    request("/api/v1/templates/wait_for_contact", template_data)
  end

  def get_forward_to_support_template template_data
    "I FORWARD TO SUPPORT"
  end

  def get_forward_to_client_template template_data
    request("/api/v1/templates/forward_to_client", template_data)
  end

  def get_suggest_dates_template template_data
    request("/api/v1/templates/suggest_dates", template_data)
  end

  def get_say_hi_template template_data
    request("/api/v1/templates/say_hi", template_data)
  end

  def get_usage_name template_data
    request("/api/v1/templates/usage_name", template_data)
  end

  private

  def request path, body=nil
    uri = URI.parse("#{ENV['TEMPLATE_GENERATOR_BASE_PATH']}")
    http = Net::HTTP.new(uri.host, uri.port)
    http.use_ssl = true
    http.verify_mode = OpenSSL::SSL::VERIFY_NONE
    request = Net::HTTP::Post.new(path)
    request.add_field('Content-Type', 'application/json')
    if body
      request.body = body.to_json
    end
    response = http.request(request)
    JSON.parse(response.body)['data']['text']
  end
end