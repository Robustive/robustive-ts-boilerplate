<script setup lang="ts">
import { FrontendService, SERVICE_KEY } from "../../implementation/frontend/stores"

import { inject, reactive } from "vue"
import { R } from "../../domain/usecases"

const {
  states,
  actions: { dispatch }
} = inject<FrontendService>(SERVICE_KEY)!

const state = reactive<{
  isDialogOpen: boolean
}>({
  isDialogOpen: false
})

const onClick = () => {
  dispatch(
    R.application.hello.basics.フロントエンドはバックエンドにHelloを送る({
      hello: "Backend"
    })
  ).then(() => {
    if (states.application.replyFromBackend !== undefined) {
      state.isDialogOpen = true
    }
  })
}
</script>

<template>
  <v-container class="d-flex align-center justify-center" style="min-height: 300px">
    <v-btn @click="onClick()">Hello Backend!!</v-btn>
  </v-container>
  <v-dialog v-model="state.isDialogOpen" width="auto">
    <v-card
      width="400"
      prepend-icon="mdi-check"
      title="Hello"
      :text="states.application.replyFromBackend"
    >
      <template v-slot:actions>
        <v-btn class="ms-auto" text="Ok" @click="state.isDialogOpen = false"></v-btn>
      </template>
    </v-card>
  </v-dialog>
</template>

<style lang="sass" scoped></style>
