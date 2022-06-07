#!/usr/bin/env ruby

class PersonNode
  attr_reader :name, :id, :gender, :is_dead
  attr_accessor :parents_union

  def initialize(name, gender, id: nil, is_dead: false)
    @name = name
    @id = id || self.name.gsub(" ", "").gsub("-", "")
    @gender = gender
    @is_dead = is_dead
    @parents_union = nil
  end

  def to_s
    "#{name} (#{gender}, id=#{id}, dead=#{is_dead})"
  end

  def inspect
    to_s
  end
end

class UnionNode
  attr_reader :person_1, :person_2
  attr_reader :children
  attr_reader :are_separated

  def initialize(person_1, person_2, are_separated)
    @person_1 = person_1
    @person_2 = person_2
    @are_separated = are_separated
    @children = []
  end

  def add_child(person)
    person.parents_union = self
    self.children << person
  end

  def to_s
    parents = person_1.to_s + "\n" + person_2.to_s + "\n"
    separated = are_separated ? "<separated>\n" : ""
    parents + separated + children.map { |c| "\t" + c.to_s }.join("\n")
  end

  def inspect
    to_s
  end
end

class FileParser
  attr_reader :line_num
  attr_reader :people, :unions
  attr_reader :filehandle

  def initialize(file="people-raw.txt")
    @people = {}
    @unions = []
    @line_num = 0
    @filehandle = File.open(file, "r")
  end

  def assert!(condition, message)
    raise "L#{line_num}) #{message}" if !condition
  end

  def parse!
    while (family = next_family!) != nil && !family.empty? do
      person_1 = get_person(family.shift)
      person_2 = get_person(family.shift)
      separated = false
      if family[0]&.upcase == "S" || family[0]&.upcase == "SEPARATED"
        separated = true
        family.shift
      end

      union = UnionNode.new(person_1, person_2, separated)
      unions << union
      family.each do |line|
        child = get_person(line)
        union.add_child(child)
      end
    end
  end

  def validate!
    # genderless
    no_gender = []
    people.values.each do |p|
      if p.gender.nil?
        no_gender << p
      end
    end

    if no_gender.size > 0
      raise "The following people don't have a gender set: \n" + no_gender.join("\n")
    end
  end

  private

  def next_line!
    while (line = filehandle.readline&.strip) != nil do
      @line_num += 1
      next if line.start_with?("#")
      return line
    end
  rescue EOFError
    nil
  end

  def next_family!
    family_lines = []
    while (line = next_line!) != nil && !line.empty? do
      family_lines << line
    end
    family_lines
  end

  def get_person(line)
    name, attrs_line = line.split("(")
    assert!(!name.nil?, "Name is nil while getting person from: #{line}")

    attrs = {}

    if !attrs_line.nil?
      attrs_line.gsub(")", "").split(",").map!(&:strip).each do |a|
        if ["M", "F"].include?(a.upcase)
          attrs["gender"] = a
        else
          k, v = a.split("=").map(&:strip)
          attrs[k] = v
        end
      end
    end

    id = attrs["id"]
    is_dead = !attrs["deathday"].nil?
    p = PersonNode.new(name.strip, attrs["gender"], id: id, is_dead: is_dead)

    if people[p.id].nil?
      people[p.id] = p
      return p
    else
      return people[p.id]
    end
  end
end

f = FileParser.new
f.parse!
f.validate!
