class TargetHobbiesTag < ApplicationRecord
  belongs_to :target, polymorphic: true
end