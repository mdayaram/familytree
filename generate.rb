#!/usr/bin/env ruby

require 'json'

people_arr = File.read("people.csv").gsub("\"", "").split("\n")
people_arr.shift # forget the first line, labels

# remove/ignore empty lines and comment lines
people_arr = people_arr.reject { |line| line.strip.empty? }
people_arr = people_arr.reject { |line| line.strip.start_with?(",") }
people_arr = people_arr.reject { |line| line.strip.start_with?("#") }

people_by_name = {}
people_arr.each_with_index do |person_data, index|
  attributes = person_data.split(",")
  name = attributes.shift
  people_by_name[name] = {}
  people_by_name[name][:key] = index
  people_by_name[name][:s] = attributes.shift.strip.upcase # gender
  people_by_name[name][:f] = attributes.shift.strip if attributes.size > 0 # father
  people_by_name[name][:m] = attributes.shift.strip if attributes.size > 0 # mother
  if people_by_name[name][:s] == 'M' && attributes.size > 0
    people_by_name[name][:ux] = attributes.shift.strip # wife
  elsif people_by_name[name][:s] == 'F' && attributes.size > 0
    people_by_name[name][:vir] = attributes.shift.strip # husband
  end
  people_by_name[name][:a] = attributes.map(&:upcase).map(&:strip) # remaining attributes
end

# Now replace name occurences with key ids
people = []
people_by_name.keys.each do |name|
  final_person = {}
  person = people_by_name[name]

  final_person[:n] = name
  final_person[:key] = person[:key]
  final_person[:s] = person[:s]
  final_person[:a] = person[:a]

  final_person[:f] = people_by_name[person[:f]][:key] if person[:f] && person[:f].size > 0
  final_person[:m] = people_by_name[person[:m]][:key] if person[:m] && person[:m].size > 0
  final_person[:ux] = people_by_name[person[:ux]][:key] if person[:ux] && person[:ux].size > 0
  final_person[:vir] = people_by_name[person[:vir]][:key] if person[:vir] && person[:vir].size > 0
  people << final_person
end

structure = "var structure = #{JSON.pretty_generate people}"
File.open("assets/scripts/structure.js", "w") { |f| f.write(structure) }
puts "success"
