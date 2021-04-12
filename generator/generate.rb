#! /usr/bin/ruby 
require 'yaml'

instructions = []

ARGF.readlines.each do |line|
    line = line.gsub("\n", '').strip
    colonPosition = line.index(':')
    instruction = line[0...colonPosition]
    arguments = line[colonPosition+1..-1]
    instructions.push({instruction: instruction, arguments: arguments})
end

passage = []
instructions.each do |i|
    instruction = i[:instruction]
    arguments = i[:arguments]
    case instruction
    when 'bg'
        passage.push({ 'setup' => {'background' => arguments.strip }})
        next
    when 'c'
        characters = arguments.split(/\s*,\s*/).map {|n| n = n.strip; {'name' => n, 'caption' => n} }
        passage.push({'setup' => {'characters' => characters}})
    when 'd'
        passage.push({'description' => arguments.strip})
    else
        passage.push({'character' => instruction, 'text' => arguments.strip})
    end
end

puts YAML.dump(passage)
