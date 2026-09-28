require 'json'
require 'net/http'
require 'uri'

module Jekyll
  # Fetches GitHub repository and user stats at build time, so the repository
  # cards still show real numbers when a visitor's browser hits the GitHub API
  # rate limit (60 unauthenticated requests per hour per IP).
  class GitHubRepoStatsGenerator < Generator
    safe true
    priority :high

    def generate(site)
      config = site.data['repositories'] || {}
      stats = { 'repos' => {}, 'users' => {} }

      Array(config['github_repos']).each do |full_name|
        data = fetch("repos/#{full_name}")
        next unless data

        stats['repos'][full_name] = {
          'description' => data['description'],
          'language' => data['language'],
          'stars' => format_count(data['stargazers_count']),
          'forks' => format_count(data['forks_count']),
        }
      end

      Array(config['github_users']).each do |username|
        data = fetch("users/#{username}")
        next unless data

        stats['users'][username] = {
          'bio' => data['bio'],
          'repos' => format_count(data['public_repos']),
          'followers' => format_count(data['followers']),
        }
      end

      site.data['github_stats'] = stats
    end

    private

    # Successful responses are kept for the lifetime of the process, so
    # `jekyll serve` does not refetch on every regeneration.
    def fetch(path)
      @cache ||= {}
      return @cache[path] if @cache.key?(path)

      uri = URI("https://api.github.com/#{path}")
      request = Net::HTTP::Get.new(uri)
      request['Accept'] = 'application/vnd.github+json'
      request['User-Agent'] = 'jekyll-github-repo-stats'
      token = ENV['GITHUB_TOKEN']
      request['Authorization'] = "Bearer #{token}" if token && !token.empty?

      response = Net::HTTP.start(uri.host, uri.port, use_ssl: true, open_timeout: 10, read_timeout: 10) do |http|
        http.request(request)
      end

      unless response.is_a?(Net::HTTPSuccess)
        Jekyll.logger.warn 'GitHub stats:', "#{path} returned HTTP #{response.code}"
        return nil
      end

      @cache[path] = JSON.parse(response.body)
    rescue StandardError => e
      Jekyll.logger.warn 'GitHub stats:', "failed to fetch #{path}: #{e.class} - #{e.message}"
      nil
    end

    # Same format as formatCount() in assets/js/repo-cards.js.
    def format_count(value)
      value = value.to_i
      return value.to_s if value < 1000

      format('%.1f', value / 1000.0).sub(/\.0\z/, '') + 'k'
    end
  end
end
