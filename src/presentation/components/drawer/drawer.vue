<script setup lang="ts">
import { SignInStatus } from "@domain/models/authentication/user"
import { DrawerContentType } from "."
import type { DrawerItem } from "."
import { computed, onBeforeUnmount, onMounted, reactive, watch } from "vue"

const props = defineProps<{
  modelValue: boolean
  signInStatus: SignInStatus
  items: DrawerItem[]
}>()

const emits = defineEmits<{
  (e: "update:modelValue", isOpen: boolean): void
}>()

const state = reactive<{
  isOpen: boolean
  openings: string[]
  selected: DrawerItem[] | undefined
}>({
  isOpen: props.modelValue,
  openings: [],
  selected: undefined
})

watch(
  () => props.modelValue,
  (newVal: boolean) => {
    state.isOpen = newVal
  }
)

const unselector = () => {
  state.selected = undefined
}

onMounted(() => {
  window.addEventListener("popstate", unselector)
})

onBeforeUnmount(() => {
  window.removeEventListener("popstate", unselector)
})

const photoUrl = computed((): string | undefined => {
  return props.signInStatus.case === SignInStatus.keys.signIn
    ? (props.signInStatus.userProperties.photoUrl ?? undefined)
    : undefined
})

const displayName = computed((): string | undefined => {
  return props.signInStatus.case === SignInStatus.keys.signIn
    ? (props.signInStatus.userProperties.photoUrl ?? undefined)
    : undefined
})

const status = "TODO:ステータスを表示"
</script>

<template>
  <v-navigation-drawer
    v-model="state.isOpen"
    @update:model-value="emits('update:modelValue', state.isOpen)"
  >
    <v-list bg-color="grey-lighten-4">
      <v-list-item :title="displayName" :subtitle="status" to="/profile">
        <template v-slot:prepend>
          <v-avatar size="x-large">
            <v-img v-if="photoUrl" :src="photoUrl" :alt="displayName" />
            <span class="text-h5" v-else> {{ displayName }}</span>
          </v-avatar>
        </template>
      </v-list-item>
    </v-list>
    <v-divider />
    <v-list
      nav
      v-model:opened="state.openings"
      v-model:selected="state.selected"
      open-strategy="multiple"
    >
      <template v-for="(item, idx) in props.items">
        <v-list-subheader
          v-if="item.case === DrawerContentType.subheader"
          :key="'h' + idx"
          :title="item.title"
        />
        <v-divider
          v-else-if="item.case === DrawerContentType.divider"
          :key="'d' + idx"
        />
        <v-list-group
          v-else-if="item.case === DrawerContentType.group"
          :key="'g' + idx"
          :value="item"
        >
          <template v-slot:activator="{ props }">
            <v-list-item v-bind="props" :title="item.title" />
          </template>
          <template v-for="(child, idx2) in item.children">
            <v-list-subheader
              v-if="child.case === DrawerContentType.subheader"
              :key="'g' + idx + '_h' + idx2"
              :title="child.title"
            />
            <v-divider
              v-else-if="child.case === DrawerContentType.divider"
              :key="'g' + idx + '_d' + idx2"
            />
            <v-list-item
              v-else
              :key="'g' + idx + '_g' + idx2"
              :value="child"
              :title="child.title"
              :to="child.href"
              color="primary"
              rounded="xl"
            />
          </template>
        </v-list-group>
        <v-list-item
          v-else
          :key="'i' + idx"
          :value="item"
          :title="item.title"
          :to="item.href"
          color="primary"
          rounded="xl"
        />
      </template>
    </v-list>
  </v-navigation-drawer>
</template>
