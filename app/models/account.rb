class Account

  attr_accessor :email, :calendar_nature, :appointments, :company_hash, :addresses, :usage_name, :full_name, :email_aliases, :access_token, :raw_preferences, :current_notes, :default_timezone_id, :locale, :only_admin_can_process, :block_until_preferences_change, :mobile_number, :landline_number, :skype, :means_of_transport

  def self.create_from_email email
    #account_email = self.find_account_email email
    #return nil unless account_email
    return nil unless email
    data = get_account_details email
    return nil unless data
    account = self.new
    account.email = data['email']
    account.calendar_nature = data['calendar_nature']
    account.appointments = data['appointments']
    account.addresses = data['addresses']
    account.usage_name = data['usage_name']
    account.full_name = data['full_name']
    account.email_aliases = data['email_aliases']
    account.access_token = data['access_token']
    account.company_hash = data['company_hash']
    account.raw_preferences = data['raw_preferences']
    account.current_notes = data['current_notes']
    account.default_timezone_id = data['default_timezone_id']
    account.locale = data['locale']
    account.mobile_number = data['mobile_number']
    account.landline_number = data['landline_number']
    account.skype = data['skype']
    account.means_of_transport = data['means_of_transport']
    account.only_admin_can_process = data['only_admin_can_process']
    account.block_until_preferences_change = data['block_until_preferences_change']
    account
  end

  def self.find_account_email email
    accounts = Account.get_active_account_emails detailed: true
    accounts.each do |account|
      if ([account['email']] + account['email_aliases']).include? email
        return account['email']
      end
    end

    nil
  end

  def contacts_from_same_company
    accounts = Account.get_active_account_emails detailed: true
    accounts.select{|account|
      self.company_hash &&
          account['company_hash'].try(:[], 'name') == self.company_hash['name'] &&
          self.email != account['email']
    }.map{|account|
      {
          name: account['full_name'],
          email: account['email']
      }
    }
  end

  def self.get_active_account_emails params={}
    if params[:detailed]
      self.accounts_cache.values
    else
      self.accounts_cache.keys
    end
  end

  def all_emails
    [email] + email_aliases
  end

  def client_info
    <<END
    Mobile: #{self.mobile_number}
    Landline: #{self.landline_number}
    Skype: #{self.skype}
    Means of transport: #{self.means_of_transport}
    Office: #{self.addresses.select{|addr| addr['type'] == "office"}.map{|add| add['address']}.first}
END
  end

  def serializable_hash
    self.to_json
  end

  private

  def self.accounts_cache
    JSON.parse(REDIS.get("accounts_cache") || "{}")
  end

  def self.get_account_details account_email
    self.accounts_cache[account_email]
  end
end