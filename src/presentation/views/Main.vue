<script setup lang="ts">
import { FrontendService, SERVICE_KEY } from "@frontend/stores"
import { inject, reactive, watch } from "vue"
import drawer from "@presentation/components/drawer/drawer.vue"
import { SignInStatus } from "@domain/models/authentication/user"
import { R } from "@domain/usecases"

const {
  states,
  actions: { dispatch }
} = inject<FrontendService>(SERVICE_KEY)!

const state = reactive<{
  isDrawerOpen: boolean
  isDialogOpen: boolean
  dialogTitle: string | null
  dialogBody: string | null
}>({
  isDrawerOpen: true,
  isDialogOpen: false,
  dialogTitle: null,
  dialogBody: null
})

const onClickSignIn = () => {
  console.log("onClickSignIn")
  dispatch(R.authentication.signIn.basics.ユーザはサインインボタンを押下する())
}

const onClickSignOut = () => {
  console.log("onClickSignOut")
  dispatch(R.authentication.signOut.basics.ユーザはサインアウトボタンを押下する())
}

// main.ts で dispatch している bootユースケースの結果でエラーが発生していないかを監視
// (bootの呼び出しをここに持ってきて then でエラーを監視した方がシンプルになるかも)
watch(
  () => states.shared.sessionStoredError,
  (newValue) => {
    if (newValue !== null) {
      state.isDialogOpen = true
      const { title, body } = newValue()
      state.dialogTitle = title
      state.dialogBody = body
    }
  }
)
</script>

<template>
  <v-app-bar>
    <v-app-bar-nav-icon @click="state.isDrawerOpen = !state.isDrawerOpen" />
    <v-toolbar-title>Robustive Boilerplate</v-toolbar-title>
    <v-btn
      v-if="states.shared.signInStatus.case === SignInStatus.keys.signOut"
      append-icon="mdi-login"
      @click="onClickSignIn"
    >
      サインイン
    </v-btn>
    <v-btn
      v-else-if="states.shared.signInStatus.case === SignInStatus.keys.unknown"
      disabled
      append-icon="mdi-login"
    >
      サインイン
    </v-btn>
    <v-btn v-else append-icon="mdi-logout" @click="onClickSignOut"> サインアウト </v-btn>
  </v-app-bar>
  <drawer
    v-model="state.isDrawerOpen"
    :signInStatus="states.shared.signInStatus"
    :items="states.application.drawerItems"
  />
  <v-main>
    <router-view />
  </v-main>
  <v-dialog v-model="state.isDialogOpen" width="auto">
    <v-card
      width="400"
      prepend-icon="mdi-check"
      :title="state.dialogTitle || ''"
      :text="state.dialogBody || ''"
    >
      <template v-slot:actions>
        <v-btn class="ms-auto" text="Ok" @click="state.isDialogOpen = false"></v-btn>
      </template>
    </v-card>
  </v-dialog>
</template>

<style lang="sass" scoped></style>
